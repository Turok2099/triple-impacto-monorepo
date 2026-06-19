"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  order: number;
}

export default function HomeBannersCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/public/banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.error("Error fetching banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length > 1) {
      startTimer();
    }
    return () => stopTimer();
  }, [banners, currentIndex]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      handleNext();
    }, 5000); // Change every 5 seconds
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  if (loading || banners.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="relative group aspect-[3/1] rounded-2xl overflow-hidden shadow-xl border border-slate-200">
          {/* Banners Slider */}
          <div 
            className="flex transition-transform duration-700 ease-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div key={banner.id} className="w-full h-full flex-shrink-0 relative">
                {banner.link_url ? (
                  <a href={banner.link_url} className="block w-full h-full relative">
                    <Image 
                      src={banner.image_url} 
                      alt={banner.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 1200px"
                      priority={index === 0}
                      unoptimized={true}
                      className="object-cover hover:scale-105 transition-transform duration-1000"
                    />
                  </a>
                ) : (
                  <div className="w-full h-full relative">
                    <Image 
                      src={banner.image_url} 
                      alt={banner.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 1200px"
                      priority={index === 0}
                      unoptimized={true}
                      className="object-cover"
                    />
                  </div>
                )}
                
                {/* Overlay/Gradient (optional) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-sm text-slate-800 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-sm text-slate-800 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
