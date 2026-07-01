import api from "./axiosInstance.js";

export const getReport = (period = "month") =>
  api.get("/reports", { params: { period } }).then((r) => r.data);
