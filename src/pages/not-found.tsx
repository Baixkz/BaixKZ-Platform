import { useNavigate } from "react-router-dom"; // wouter орнына

export default function NotFound() {
  const navigate = useNavigate(); // setLocation орнына navigate қолданамыз

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-6xl font-bold text-muted-foreground/30 mb-4">404</h1>
      <p className="text-lg font-semibold mb-2">Бет табылмады</p>
      <p className="text-sm text-muted-foreground mb-6">Сіз іздеген бет жоқ</p>
      <button
        onClick={() => navigate("/")} // Басты бетке бағыттау
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm"
      >
        Басты бетке оралу
      </button>
    </div>
  );
}
