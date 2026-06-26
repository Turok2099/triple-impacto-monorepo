"use client";

import { CuponDto } from "@/lib/types/cupon";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image, { ImageProps } from "next/image";

interface ImageWithFallbackProps extends Omit<ImageProps, "src"> {
  src: string;
  fallbackSrc: string;
}

const ImageWithFallback = ({ src, fallbackSrc, alt, ...rest }: ImageWithFallbackProps) => {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      src={imgSrc}
      alt={alt || ""}
      onError={() => setImgSrc(fallbackSrc)}
      {...rest}
    />
  );
};

interface CuponCardProps {
  cupon: CuponDto;
}

export default function CuponCard({ cupon }: CuponCardProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleObtenerDescuento = (e: React.MouseEvent) => {
    e.stopPropagation();
    const searchUrl = `/dashboard?busqueda=${encodeURIComponent(cupon.empresa.nombre)}`;
    if (isAuthenticated) {
      router.push(searchUrl);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(searchUrl)}`);
    }
  };
  const defaultImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='190' viewBox='0 0 280 190'%3E%3Crect fill='%2310b981' width='280' height='190'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='16' fill='%23fff' text-anchor='middle' dy='.3em'%3ECupón%3C/text%3E%3C/svg%3E";

  const defaultLogo =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Crect fill='%23f3f4f6' rx='12' width='90' height='90'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dy='.3em'%3E🎁%3C/text%3E%3C/svg%3E";

  const imagenPrincipal =
    cupon.imagenes.principal?.["280x190"] ||
    cupon.imagenes.thumbnail?.["90x90"] ||
    defaultImage;

  const logoEmpresa = cupon.empresa.logoThumbnail?.["90x90"] || defaultLogo;

  const descripcion =
    cupon.descripcion ||
    (cupon.descuento && cupon.empresa?.nombre
      ? `${cupon.descuento} en ${cupon.empresa.nombre}`
      : cupon.nombre);

  return (
    <>
      {/* Mobile: card horizontal compacta (solo visible en móvil) */}
      <div className="md:hidden bg-white rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="size-[4rem] sm:size-[4.5rem] shrink-0 overflow-hidden flex items-center justify-center relative">
            <ImageWithFallback
              src={logoEmpresa}
              fallbackSrc={defaultLogo}
              alt=""
              fill
              sizes="72px"
              className="object-contain scale-125"
            />
          </div>
          <div className="min-w-0 pr-1">
            <p className="font-bold text-[#1A202C] text-[13px] sm:text-sm leading-tight line-clamp-2">
              {cupon.descuento}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-1">
              {cupon.empresa.nombre}
            </p>
          </div>
        </div>
        <button 
          onClick={handleObtenerDescuento}
          className="bg-[#2c8184] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-[#2c8184]/20 active:scale-95 transition-transform shrink-0"
        >
          Obtener
        </button>
      </div>

      {/* Desktop: card vertical (oculta en móvil) */}
      <div 
        onClick={handleObtenerDescuento}
        className="hidden md:flex flex-col bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-slate-100/80 relative cursor-pointer h-full"
      >
        <div className="relative h-32 overflow-hidden bg-slate-50 shrink-0">
          <ImageWithFallback
            src={imagenPrincipal}
            fallbackSrc={defaultImage}
            alt={cupon.nombre}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
          />
        </div>

        {/* Floating Overlapping Logo Container */}
        <div className="absolute left-1/2 top-32 -translate-x-1/2 -translate-y-1/2 z-10 w-24 h-24 rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex items-center justify-center p-2 border border-slate-50 overflow-hidden">
          <ImageWithFallback
            src={logoEmpresa}
            fallbackSrc={defaultLogo}
            alt={cupon.empresa.nombre}
            fill
            sizes="96px"
            className="object-contain p-1.5"
          />
        </div>

        {/* Card Body */}
        <div className="relative z-0 pt-16 pb-6 px-5 text-center flex flex-col items-center justify-between flex-1">
          {/* Pill Badge with Company Name */}
          <div className="px-4 py-1.5 border border-slate-200/60 rounded-full text-[11px] font-bold tracking-wider text-slate-700 bg-white mb-4 shadow-sm uppercase leading-none">
            {cupon.empresa.nombre}
          </div>

          {/* Discount Headline */}
          <p className="text-3xl font-black text-slate-900 mb-2 leading-none">
            {cupon.descuento}
          </p>

          {/* Benefit Detail */}
          <p className="text-[13px] text-slate-500 font-medium leading-relaxed line-clamp-3 min-h-[3rem] px-2 mb-1">
            {descripcion}
          </p>
        </div>
      </div>
    </>
  );
}
