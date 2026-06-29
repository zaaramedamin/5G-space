import api from "./axiosInstance.js";

export const getStats = () => api.get("/dashboard/stats").then((r) => r.data);
export const getRoomsStatus = () => api.get("/dashboard/rooms-status").then((r) => r.data);
