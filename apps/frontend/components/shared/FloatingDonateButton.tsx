"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { HandHeart } from "lucide-react";

export default memo(function FloatingDonateButton() {
  const pathname = usePathname();

  if (
    pathname?.startsWith("/dashboard") ||
    (pathname?.startsWith("/donar/") && !["/donar/success", "/donar/error", "/donar"].includes(pathname))
  ) {
    return null;
  }

  return (
    <>
      <a
        href="/donar"
        className="fixed right-6 bottom-24 z-50 w-14 h-14 bg-linear-to-r from-[#40a8ab] to-teal-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        aria-label="Donar ahora"
        title="Doná ahora y recibí beneficios"
        style={{
          animation: 'bounce-slow 3s ease-in-out infinite',
        }}
      >
        <HandHeart className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
      </a>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </>
  );
});
