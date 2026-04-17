import api from "./api";

export const uploadChatFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const { data } = await api.post("/api/chat_uploads.php?action=upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!data.success) throw new Error(data.message || "Upload failed");
    return {
      success: true,
      fileUrl:  data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
    };
  } catch (err) {
    console.error("Upload error:", err);
    return { success: false, error: err.message };
  }
};

// fileUrl stored in Firestore is the relative path: "uploads/chat/chat_xxx.jpg"
// We only pass the basename to the download endpoint so the PHP can safely resolve it.
export const getFileDownloadUrl = (fileUrl) => {
  const filename = fileUrl?.split("/").pop() ?? fileUrl;
  return `${api.defaults.baseURL}/api/chat_uploads.php?action=download&file=${encodeURIComponent(filename)}`;
};
