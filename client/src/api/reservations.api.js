import api from "./axiosInstance.js";

export const getReservations = (params = {}) =>
  api.get("/reservations", { params }).then((r) => r.data);

export const getReservation = (id) => api.get(`/reservations/${id}`).then((r) => r.data);
export const createReservation = (data) => api.post("/reservations", data).then((r) => r.data);
export const updateReservation = (id, data) => api.put(`/reservations/${id}`, data).then((r) => r.data);
export const checkinReservation = (id) => api.post(`/reservations/${id}/checkin`).then((r) => r.data);
export const checkoutReservation = (id) => api.post(`/reservations/${id}/checkout`).then((r) => r.data);
export const cancelReservation = (id, cancel_reason) =>
  api.post(`/reservations/${id}/cancel`, { cancel_reason }).then((r) => r.data);
export const updatePayment = (id, data) =>
  api.patch(`/reservations/${id}/payment`, data).then((r) => r.data);
