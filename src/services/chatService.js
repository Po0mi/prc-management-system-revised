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
  const phpId = phpUserId.toString();

  // Try Firestore registry first
  try {
    const userRef = doc(db, "userRegistry", phpId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return {
        user_id: phpId,
        full_name: snap.data().name,
        role: snap.data().role,
      };
    }
  } catch (e) {
    // fall through to PHP
  }

  // Fallback: PHP backend
  try {
    const res = await api.get("/api/users.php", { params: { id: phpId } });
    const u = res.data?.data || res.data?.user;
    if (u) return { user_id: phpId, full_name: u.full_name, role: u.role };
  } catch (e) {
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

  return onSnapshot(
    q,
    async (snapshot) => {
      const conversations = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const otherPhpId = data.participants.find((id) => id !== phpId);
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
      console.error("Conversation listener error:", error);
      callback([]);
    },
  );
};

// ─── MESSAGES ────────────────────────────────────────────────────────────────

export const sendMessage = async (
  conversationId,
  senderPhpId,
  recipientPhpId,
  content,
  messageType = "text",
  fileUrl = null,
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
    senderId, // PHP user ID
    recipientId, // PHP user ID
    content,
    messageType,
    fileUrl,
    createdAt: serverTimestamp(),
    read: false,
  };

  await addDoc(messagesRef, message);

  // Update conversation metadata
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, {
    lastMessage: content,
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`unreadCount.${recipientId}`]: increment(1),
  });

  return message;
};

export const subscribeToMessages = (conversationId, callback) => {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages",
  );
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      callback(messages);
    },
    (error) => {
      console.error("Message listener error:", error);
      callback([]);
    },
  );
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
