// src/services/chatUploadApi.js
import api from "./api";

const BASE = "/api/chat_uploads.php";

export const uploadChatFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await api.post(`${BASE}?action=upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (!data.success) {
      throw new Error(data.message || "Upload failed");
    }

    return {
      success: true,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false, error: error.message };
  }
};

export const getFileDownloadUrl = (fileUrl) => {
  return `http://localhost/prc-management-system/backend/api/chat_uploads.php?action=download&file=${encodeURIComponent(fileUrl)}`;
};

export default {
  uploadChatFile,
  getFileDownloadUrl,
};
