import { useEffect, useState } from "react";

// Reactive media-query hook — true while the viewport is at/under `bp` px.
export function useIsMobile(bp = 768) {
  const query = `(max-width: ${bp}px)`;
  const [match, setMatch] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return match;
}
