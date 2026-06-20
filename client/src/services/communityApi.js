import api from "./api";

export const fetchCommunityPosts = () => api.get("/api/community/posts");
export const createCommunityPost = (payload) => api.post("/api/community/posts", payload);
export const likeCommunityPost = (postId) => api.post(`/api/community/posts/${postId}/like`);
export const addCommunityComment = (postId, payload) =>
  api.post(`/api/community/posts/${postId}/comments`, payload);
