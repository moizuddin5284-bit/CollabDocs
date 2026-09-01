import { useState } from "react";

export default function Avatar({ user, size = "md", className = "", style = {} }) {
  const [imgError, setImgError] = useState(false);

  if (!user) {
    return (
      <span className={`avatar avatar-${size} ${className}`} style={{ background: "#94a3b8", ...style }}>
        ?
      </span>
    );
  }

  const initials = (user.name || "User")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === "xs" ? "avatar-xs" : size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : size === "xl" ? "avatar-xl" : "";

  if (user.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user.name || "Avatar"}
        className={`avatar ${sizeClass} avatar-img ${className}`}
        style={style}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      className={`avatar ${sizeClass} ${className}`}
      style={{ background: user.color || "var(--primary)", ...style }}
      title={user.name}
    >
      {initials}
    </span>
  );
}
