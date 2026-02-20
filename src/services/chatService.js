// src/services/chatService.js
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
  getDoc, // ← ADD THIS MISSING IMPORT
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import api from "./api";

// ─── CONVERSATIONS ───────────────────────────────────────────────────────────

// Get or create a conversation between two users
export const getOrCreateConversation = async (firebaseUid, otherUserId) => {
  try {
    console.log(
      "Getting/creating conversation between",
      firebaseUid,
      "and",
      otherUserId,
    );

    // Check if conversation already exists
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", firebaseUid),
    );

    const querySnapshot = await getDocs(q);
    let existingConversation = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(otherUserId)) {
        existingConversation = { id: doc.id, ...data };
      }
    });

    if (existingConversation) {
      console.log("Found existing conversation:", existingConversation);
      return existingConversation;
    }

    // Create new conversation
    console.log("Creating new conversation");
    const newConversation = {
      participants: [firebaseUid, otherUserId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: null,
      unreadCount: { [firebaseUid]: 0, [otherUserId]: 0 },
    };

    const docRef = await addDoc(
      collection(db, "conversations"),
      newConversation,
    );
    console.log("New conversation created with ID:", docRef.id);
    return { id: docRef.id, ...newConversation };
  } catch (error) {
    console.error("Error getting/creating conversation:", error);
    throw error;
  }
};

// Get user's conversations with real-time updates
export const subscribeToConversations = (firebaseUid, callback) => {
  console.log("Setting up conversation listener for:", firebaseUid);

  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", firebaseUid),
    orderBy("updatedAt", "desc"),
  );

  return onSnapshot(
    q,
    async (snapshot) => {
      console.log("Conversation snapshot received, size:", snapshot.size);
      const conversations = [];

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const otherUserId = data.participants.find((id) => id !== firebaseUid);

        // First try to get user from Firestore
        try {
          const userDocRef = doc(db, "users", otherUserId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // User found in Firestore
            conversations.push({
              id: docSnapshot.id,
              ...data,
              otherUser: {
                user_id: userDoc.data().userId,
                full_name: userDoc.data().name,
                role: userDoc.data().role,
              },
              unread: data.unreadCount?.[firebaseUid] || 0,
            });
            continue; // Skip the PHP fetch
          }
        } catch (firestoreError) {
          console.log(
            "User not found in Firestore, trying PHP...",
            firestoreError,
          );
        }

        // Fallback to PHP backend if not in Firestore
        try {
          const userRes = await api.get("/api/users.php", {
            params: { id: otherUserId },
          });

          conversations.push({
            id: docSnapshot.id,
            ...data,
            otherUser: userRes.data?.data || {
              full_name: "Unknown User",
              user_id: otherUserId,
            },
            unread: data.unreadCount?.[firebaseUid] || 0,
          });
        } catch (error) {
          console.error("Error fetching user from PHP:", error);
          conversations.push({
            id: docSnapshot.id,
            ...data,
            otherUser: {
              full_name: "Unknown User",
              user_id: otherUserId,
            },
            unread: data.unreadCount?.[firebaseUid] || 0,
          });
        }
      }

      callback(conversations);
    },
    (error) => {
      console.error("Conversation listener error:", error);
      callback([]); // Return empty array on error
    },
  );
};

// ─── MESSAGES ────────────────────────────────────────────────────────────────

// Send a message
export const sendMessage = async (
  conversationId,
  senderId,
  recipientId,
  content,
  messageType = "text",
  fileUrl = null,
) => {
  try {
    console.log("Sending message:", {
      conversationId,
      senderId,
      recipientId,
      content,
    });

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
      createdAt: serverTimestamp(),
      read: false,
    };

    await addDoc(messagesRef, message);

    // Update conversation last message
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessage: content,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCount.${recipientId}`]: (data) => (data || 0) + 1,
    });

    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Subscribe to messages in a conversation
export const subscribeToMessages = (conversationId, callback) => {
  console.log("Setting up message listener for conversation:", conversationId);

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
        createdAt: doc.data().createdAt?.toDate(),
      }));
      callback(messages);
    },
    (error) => {
      console.error("Message listener error:", error);
      callback([]); // Return empty array on error
    },
  );
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages",
    );
    const q = query(
      messagesRef,
      where("recipientId", "==", userId),
      where("read", "==", false),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);

    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    const conversationRef = doc(db, "conversations", conversationId);
    batch.update(conversationRef, {
      [`unreadCount.${userId}`]: 0,
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};
