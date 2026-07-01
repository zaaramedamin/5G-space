import api from "./axiosInstance.js";

export const getRooms = (all = false) =>
  api.get("/rooms", { params: all ? { all: 1 } : {} }).then((r) => r.data);

export const createRoom = (data) => api.post("/rooms", data).then((r) => r.data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data).then((r) => r.data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`).then((r) => r.data);
export const hardDeleteRoom = (id) => api.delete(`/rooms/${id}`, { params: { hard: 1 } }).then((r) => r.data);
