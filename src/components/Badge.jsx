import React from "react";
import { BADGE } from "../utils/constants";

export default function Badge({ cat }) {
  const x = BADGE[cat] || { bg: "#f5f5f5", c: "#555" };
  return (
    <span
      style={{
        background: x.bg,
        color: x.c,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      {cat}
    </span>
  );
}
