import { useEffect, useState, useCallback } from "react";
import { getReservations } from "../api/reservations.api.js";

// Loads reservations for the given filter object. Re-fetches when filters change.
export function useReservations(filters = {}) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(filters);

  const reload = useCallback(() => {
    setLoading(true);
    getReservations(JSON.parse(key))
      .then(setReservations)
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, [key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { reservations, loading, reload };
}

export default useReservations;
