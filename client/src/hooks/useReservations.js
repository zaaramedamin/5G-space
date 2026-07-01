import { useCallback, useEffect, useState } from "react";
import { getReservations } from "../api/reservations.api.js";

export function useReservations(filters = {}, pageSize = 30) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(filters);

  // Reset to page 1 whenever filters change.
  useEffect(() => { setPage(1); }, [key]);

  const reload = useCallback(() => {
    setLoading(true);
    getReservations({ ...JSON.parse(key), page, limit: pageSize })
      .then((res) => setResult(res && res.data ? res : { data: res, total: res?.length || 0, pages: 1 }))
      .catch(() => setResult({ data: [], total: 0, pages: 1 }))
      .finally(() => setLoading(false));
  }, [key, page, pageSize]);

  useEffect(() => { reload(); }, [reload]);

  return { reservations: result.data, loading, reload, page, setPage, total: result.total, pages: result.pages };
}

export default useReservations;
