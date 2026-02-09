"use client";

export default function FloatingDonateButton() {
  return (
    <>
      <a
        href="/donar"
        className="fixed right-6 top-24 z-40 px-6 py-3 bg-linear-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center gap-2 animate-bounce-slow"
        style={{
          animation: 'bounce-slow 3s ease-in-out infinite',
        }}
      >
        <span className="text-xl">💚</span>
        <span>Donar ahora</span>
      </a>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  );
}
