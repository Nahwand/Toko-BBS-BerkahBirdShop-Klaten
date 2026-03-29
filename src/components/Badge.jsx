import { BADGE } from "../utils/constants";

const BADGE_CLASSES = {
  "Pakan Jadi":    "bg-green-100 text-green-800",
  "Pakan Kiloan":  "bg-amber-100 text-amber-700",
  "Pakan Segar":   "bg-blue-100 text-blue-800",
  "Cemilan Hewan": "bg-pink-100 text-pink-800",
  "Suplemen":      "bg-purple-100 text-purple-800",
  "Pakan Kucing":  "bg-teal-100 text-teal-800",
};

export default function Badge({ cat }) {
  const cls = BADGE_CLASSES[cat] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      {cat}
    </span>
  );
}
