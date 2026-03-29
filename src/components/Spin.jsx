export default function Spin({ size = 24, color = "#2d7a2d" }) {
  return (
    <div
      style={{ width: size, height: size, borderTopColor: color }}
      className="border-3 border-green-100 rounded-full animate-spin"
    />
  );
}
