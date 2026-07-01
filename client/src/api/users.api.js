import api from "./axiosInstance.js";

export const getUsers = () => api.get("/users").then((r) => r.data);
export const createUser = (data) => api.post("/users", data).then((r) => r.data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data).then((r) => r.data);
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate`).then((r) => r.data);
export const deleteUser = (id) => api.delete(`/users/${id}`).then((r) => r.data);
