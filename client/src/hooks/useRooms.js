import { useEffect, useState, useCallback } from "react";
import { getRooms } from "../api/rooms.api.js";

// Loads rooms once (active only by default). Returns { rooms, loading, reload }.
export function useRooms(all = false) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    getRooms(all)
      .then(setRooms)
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, [all]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rooms, loading, reload };
}

export default useRooms;
