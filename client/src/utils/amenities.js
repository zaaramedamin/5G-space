// Shared catalog of room amenities (key stored in DB + Bootstrap icon).
export const AMENITIES = [
  { key: "Projecteur", icon: "bi-projector" },
  { key: "Tableau blanc", icon: "bi-easel2" },
  { key: "Visioconférence", icon: "bi-camera-video" },
  { key: "Climatisation", icon: "bi-snow" },
  { key: "Wi-Fi", icon: "bi-wifi" },
  { key: "Écran TV", icon: "bi-tv" },
];

export const amenityIcon = (key) => AMENITIES.find((a) => a.key === key)?.icon || "bi-dot";
