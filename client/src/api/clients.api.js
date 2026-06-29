import api from "./axiosInstance.js";

export const getClients = (params = {}) =>
  api.get("/clients", { params }).then((r) => r.data);

export const getClient = (id) => api.get(`/clients/${id}`).then((r) => r.data);

// Used by the reservation modal to check a CIN against the blacklist.
export const lookupByCin = (cin) =>
  api.get("/clients", { params: { cin } }).then((r) => r.data);

export const blacklistClient = (id, reason) =>
  api.post(`/clients/${id}/blacklist`, { reason }).then((r) => r.data);
export const unblacklistClient = (id) =>
  api.post(`/clients/${id}/unblacklist`).then((r) => r.data);
