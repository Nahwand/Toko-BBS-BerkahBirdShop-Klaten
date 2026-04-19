export default function SectionSpin({ size = 16 }) {
  return (
    <div className="flex items-center justify-center py-4">
      <div
        style={{
          width: size, height: size,
          border: `2px solid #e4ede4`,
          borderTop: `2px solid #2d7a2d`,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  );
}
