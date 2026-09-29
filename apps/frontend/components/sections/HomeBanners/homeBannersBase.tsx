"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  device_type: "desktop" | "mobile";
  link_url?: string;
  order: number;
}

interface HomeBannersBaseProps {
  deviceType: "desktop" | "mobile";
}

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;

// Proporciones y visibilidad por dispositivo. Mantener en sync con las medidas
// recomendadas en SeccionAdminBanners (desktop 1800x600, mobile 1080x1350).
const VARIANTS = {
  desktop: {
    section: "hidden md:block",
    container: "px-6 py-8",
    aspect: "aspect-[3/1]",
    arrowPos: ["left-4", "right-4"],
    arrowBtn: "p-2",
    arrowIcon: "w-6 h-6",
  },
  mobile: {
    section: "block md:hidden",
    container: "px-4 py-6",
    aspect: "aspect-[4/5]",
    arrowPos: ["left-2", "right-2"],
    arrowBtn: "p-1.5",
    arrowIcon: "w-5 h-5",
  },
} as const;

export default function HomeBannersBase({ deviceType }: HomeBannersBaseProps) {
  const v = VARIANTS[deviceType];
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/public/banners`,
        );
        if (res.ok) {
          const data: Banner[] = await res.json();
          setBanners(data.filter((b) => b.device_type === deviceType));
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [deviceType]);

  const total = banners.length;

  // Autoplay: se pausa con hover/foco/touch y se omite si el usuario prefiere menos movimiento
  useEffect(() => {
    if (total <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [total, paused, currentIndex]);

  const handleNext = () =>
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  const handlePrev = () =>
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    setPaused(false);
    if (startX === null || total <= 1) return;
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) handleNext();
    else handlePrev();
  };

  if (loading || total === 0) return null;

  return (
    <section
      className={`relative w-full overflow-hidden bg-slate-50 border-y border-slate-100 ${v.section}`}
      aria-roledescription="carrusel"
      aria-label="Banners destacados"
    >
      <div className={`max-w-7xl mx-auto ${v.container}`}>
        <div
          className={`relative group ${v.aspect} rounded-2xl overflow-hidden shadow-xl border border-slate-200`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-700 ease-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className="w-full h-full flex-shrink-0 relative"
                role="group"
                aria-roledescription="diapositiva"
                aria-label={`${index + 1} de ${total}`}
                aria-hidden={index !== currentIndex}
              >
                {banner.link_url ? (
                  <a
                    href={banner.link_url}
                    className="block w-full h-full relative"
                    tabIndex={index === currentIndex ? 0 : -1}
                  >
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      draggable={false}
                    />
                  </a>
                ) : (
                  <div className="w-full h-full relative">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      draggable={false}
                    />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            ))}
          </div>

          {total > 1 && (
            <>
              {/* Siempre visibles en móvil (no hay hover); en desktop aparecen al pasar el mouse o con foco */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Banner anterior"
                className={`absolute ${v.arrowPos[0]} top-1/2 -translate-y-1/2 ${v.arrowBtn} rounded-full bg-white/80 backdrop-blur-sm text-slate-800 shadow-md transition-all hover:bg-white focus:opacity-100 ${deviceType === "desktop" ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
              >
                <ChevronLeft className={v.arrowIcon} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Banner siguiente"
                className={`absolute ${v.arrowPos[1]} top-1/2 -translate-y-1/2 ${v.arrowBtn} rounded-full bg-white/80 backdrop-blur-sm text-slate-800 shadow-md transition-all hover:bg-white focus:opacity-100 ${deviceType === "desktop" ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
              >
                <ChevronRight className={v.arrowIcon} />
              </button>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex">
                {banners.map((banner, index) => (
                  <button
                    type="button"
                    key={banner.id}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Ir al banner ${index + 1}`}
                    aria-current={index === currentIndex}
                    className="p-1.5"
                  >
                    <span
                      className={`block w-2.5 h-2.5 rounded-full transition-all ${index === currentIndex ? "bg-white scale-125" : "bg-white/40"}`}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
