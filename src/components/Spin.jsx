import React from "react";

export default function Spin() {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        border: "3px solid #e0ede0",
        borderTopColor: "#2d7a2d",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}
