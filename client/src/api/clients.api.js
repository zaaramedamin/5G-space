import api from "./axiosInstance.js";

export const getClients = (params = {}) =>
  api.get("/clients", { params }).then((r) => r.data);

export const getClient = (id) => api.get(`/clients/${id}`).then((r) => r.data);

// Returns a flat array of matching clients (used for CIN blacklist check in reservation modal).
export const lookupByCin = (cin) =>
  api.get("/clients", { params: { cin, limit: 5 } }).then((r) => r.data.data || []);

export const blacklistClient = (id, reason) =>
  api.post(`/clients/${id}/blacklist`, { reason }).then((r) => r.data);
export const unblacklistClient = (id) =>
  api.post(`/clients/${id}/unblacklist`).then((r) => r.data);
