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
          className="bg-[#40a8ab] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-[#40a8ab]/20 active:scale-95 transition-transform shrink-0"
        >
          Obtener
        </button>
      </div>

      {/* Desktop: card vertical (oculta en móvil) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 relative">
        <div className="relative h-44 overflow-hidden bg-gray-100">
          <ImageWithFallback
            src={imagenPrincipal}
            fallbackSrc={defaultImage}
            alt={cupon.nombre}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
          />
          <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full bg-white text-black text-sm font-medium shadow-md">
            {cupon.empresa.nombre}
          </div>
        </div>

        <div className="absolute left-1/2 top-[8rem] sm:top-[7rem] -translate-x-1/2 z-10 w-36 h-36 sm:w-[10.5rem] sm:h-[10.5rem] rounded-xl bg-white shadow-lg flex items-center justify-center p-1 ring-2 ring-white overflow-hidden relative">
          <ImageWithFallback
            src={logoEmpresa}
            fallbackSrc={defaultLogo}
            alt={cupon.empresa.nombre}
            fill
            sizes="168px"
            className="object-contain p-2"
          />
        </div>

        <div className="relative z-0 pt-24 sm:pt-32 pb-5 px-5 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            {cupon.descuento}
          </p>
          <p className="text-sm text-gray-500 line-clamp-3 min-h-[3.6rem]">{descripcion}</p>
          <button 
            onClick={handleObtenerDescuento}
            className="mt-4 w-full py-2.5 bg-[#40a8ab] hover:bg-[#2c8184] text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Obtener descuento
          </button>
        </div>
      </div>
    </>
  );
}
