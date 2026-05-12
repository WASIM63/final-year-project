export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        position: "relative",
      }}
    >
      {/* Animated gradient orb behind the card */}
      <div
        className="animate-float"
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, rgba(99,102,241,0.04) 50%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}
