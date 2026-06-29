import api from "./axiosInstance.js";

export const getAudit = (params = {}) =>
  api.get("/audit", { params }).then((r) => r.data);
