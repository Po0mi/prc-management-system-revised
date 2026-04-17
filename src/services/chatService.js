// src/services/chatService.js
//
// KEY DESIGN DECISION:
// All participant IDs stored as PHP user_id strings (e.g. "5", "7")
// Firebase UIDs are only used locally for auth — never stored in conversation docs
// This ensures both users can find the same conversation regardless of their Firebase UID
//
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/config";
import api from "./api";

// ─── USER REGISTRY ────────────────────────────────────────────────────────────
// Maps firebaseUid → phpUserId so we can resolve the current user's PHP ID

const _uidToPhpId = new Map(); // in-memory cache

export const registerUser = async (firebaseUid, phpUserId, name, role) => {
  const phpId = phpUserId.toString();

  // Cache locally
  _uidToPhpId.set(firebaseUid, phpId);

  // Store in Firestore: keyed by phpUserId so anyone can look up by PHP ID
  const userRef = doc(db, "userRegistry", phpId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      phpUserId: phpId,
      firebaseUid,
      name: name || "User",
      role: role || "user",
      createdAt: serverTimestamp(),
    });
  } else {
    // Update firebaseUid in case it changed (anonymous re-auth)
    await updateDoc(userRef, {
      firebaseUid,
      name: name || snap.data().name,
      lastActive: serverTimestamp(),
    });
    _uidToPhpId.set(firebaseUid, snap.data().phpUserId);
  }

  return phpId;
};

export const getPhpUserId = (firebaseUid) => {
  return _uidToPhpId.get(firebaseUid) || null;
};

const getUserInfo = async (phpUserId) => {
  if (!phpUserId) return { user_id: null, full_name: "Unknown User", role: "user" };
  const phpId = phpUserId.toString();

  // Try Firestore registry first
  try {
    const userRef = doc(db, "userRegistry", phpId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return {
        user_id: phpId,
        full_name: snap.data().name || "Unknown User",
        role: snap.data().role || "user",
      };
    }
  } catch {
    // fall through to PHP
  }

  // Fallback: PHP backend
  try {
    const res = await api.get("/api/users.php", { params: { action: "get", id: phpId } });
    const u = res.data?.user;
    if (u) return { user_id: phpId, full_name: u.full_name || "Unknown User", role: u.role || "user" };
  } catch {
    // ignore
  }

  return { user_id: phpId, full_name: "Unknown User", role: "user" };
};

// ─── CONVERSATIONS ────────────────────────────────────────────────────────────

// Both myPhpId and otherPhpId are PHP user_id strings
export const getOrCreateConversation = async (myPhpId, otherPhpId) => {
  const id1 = myPhpId.toString();
  const id2 = otherPhpId.toString();

  // Canonical conversation ID: sorted IDs joined, avoids duplicate convos
  const conversationId = [id1, id2].sort().join("_");

  const conversationRef = doc(db, "conversations", conversationId);
  const snap = await getDoc(conversationRef);

  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }

  // Create new conversation with deterministic ID
  const newConversation = {
    participants: [id1, id2], // Always PHP user IDs
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    lastMessageTime: null,
    unreadCount: { [id1]: 0, [id2]: 0 },
  };

  await setDoc(conversationRef, newConversation);
  return { id: conversationId, ...newConversation };
};

export const subscribeToConversations = (myPhpId, callback) => {
  const phpId = myPhpId.toString();

  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", phpId),
    orderBy("updatedAt", "desc"),
  );

  let unsubscribeFn = null;
  let retryTimeout = null;
  let retryCount = 0;
  let cancelled = false;

  const attach = () => {
    if (cancelled) return;

    unsubscribeFn = onSnapshot(
      q,
      async (snapshot) => {
        retryCount = 0;
        const conversations = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            const participants = Array.isArray(data.participants) ? data.participants : [];
            const otherPhpId = participants.find((id) => id !== phpId) ?? null;
            const otherUser = await getUserInfo(otherPhpId);
            return {
              id: docSnapshot.id,
              ...data,
              otherUser,
              unread: data.unreadCount?.[phpId] || 0,
            };
          }),
        );
        callback(conversations);
      },
      (error) => {
        console.error("Conversation listener error:", error.code, error.message);
        unsubscribeFn = null;
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        retryCount++;
        console.warn(`Retrying conversation subscription in ${delay}ms (attempt ${retryCount})`);
        retryTimeout = setTimeout(attach, delay);
      },
    );
  };

  attach();

  return () => {
    cancelled = true;
    clearTimeout(retryTimeout);
    unsubscribeFn?.();
  };
};

// ─── MESSAGES ────────────────────────────────────────────────────────────────

export const sendMessage = async (
  conversationId,
  senderPhpId,
  recipientPhpId,
  content,
  messageType = "text",
  fileUrl = null,
  fileMime = null,
) => {
  const senderId = senderPhpId.toString();
  const recipientId = recipientPhpId.toString();

  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages",
  );

  const message = {
    senderId,
    recipientId,
    content,
    messageType,
    fileUrl,
    fileMime,
    createdAt: serverTimestamp(),
    read: false,
  };

  await addDoc(messagesRef, message);

  // Update conversation metadata
  const conversationRef = doc(db, "conversations", conversationId);
  const lastMessagePreview =
    messageType === "image" ? "📷 Image" :
    messageType === "file"  ? "📎 File" :
    content || "";

  await updateDoc(conversationRef, {
    lastMessage: lastMessagePreview,
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`unreadCount.${recipientId}`]: increment(1),
  });

  return message;
};

export const subscribeToMessages = (conversationId, callback) => {
  let unsubscribeFn = null;
  let retryTimeout = null;
  let retryCount = 0;
  let cancelled = false;

  const attach = () => {
    if (cancelled) return;

    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    unsubscribeFn = onSnapshot(
      q,
      (snapshot) => {
        retryCount = 0; // reset on success
        const messages = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
        }));
        callback(messages);
      },
      (error) => {
        console.error("Message listener error:", error.code, error.message);
        unsubscribeFn = null;

        if (cancelled) return;

        // Retry with exponential back-off (max 30 s)
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        retryCount++;
        console.warn(`Retrying message subscription in ${delay}ms (attempt ${retryCount})`);
        retryTimeout = setTimeout(attach, delay);
      },
    );
  };

  attach();

  // Return a cancel function that stops both the listener and any pending retry
  return () => {
    cancelled = true;
    clearTimeout(retryTimeout);
    unsubscribeFn?.();
  };
};

export const markMessagesAsRead = async (conversationId, myPhpId) => {
  const phpId = myPhpId.toString();

  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages",
    );
    const q = query(
      messagesRef,
      where("recipientId", "==", phpId),
      where("read", "==", false),
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach((d) => batch.update(d.ref, { read: true }));

    const conversationRef = doc(db, "conversations", conversationId);
    batch.update(conversationRef, { [`unreadCount.${phpId}`]: 0 });

    await batch.commit();
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};
