"use client";

import { CuponDto } from "@/lib/types/cupon";

interface CuponCardProps {
  cupon: CuponDto;
}

export default function CuponCard({ cupon }: CuponCardProps) {
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
      <div className="md:hidden bg-white rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-[4.5rem] shrink-0 overflow-hidden flex items-center justify-center">
            <img
              src={logoEmpresa}
              alt=""
              className="w-full h-full object-contain scale-125"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = defaultLogo;
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#1A202C] text-sm leading-tight line-clamp-1">
              {cupon.descuento}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
              {cupon.empresa.nombre}
            </p>
          </div>
        </div>
        <button className="bg-[#16a459] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#16a459]/20 active:scale-95 transition-transform shrink-0">
          Obtener descuento
        </button>
      </div>

      {/* Desktop: card vertical (oculta en móvil) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 relative">
        <div className="relative h-44 overflow-hidden bg-gray-100">
          <img
            src={imagenPrincipal}
            alt={cupon.nombre}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultImage;
            }}
          />
          <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full bg-white text-black text-sm font-medium shadow-md">
            {cupon.empresa.nombre}
          </div>
        </div>

        <div className="absolute left-1/2 top-[8rem] sm:top-[7rem] -translate-x-1/2 z-10 w-36 h-36 sm:w-[10.5rem] sm:h-[10.5rem] rounded-xl bg-white shadow-lg flex items-center justify-center p-1 ring-2 ring-white overflow-hidden">
          <img
            src={logoEmpresa}
            alt={cupon.empresa.nombre}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultLogo;
            }}
          />
        </div>

        <div className="relative z-0 pt-24 sm:pt-32 pb-5 px-5 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            {cupon.descuento}
          </p>
          <p className="text-sm text-gray-500 line-clamp-3 min-h-[3.6rem]">{descripcion}</p>
          <button className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm">
            Obtener descuento
          </button>
        </div>
      </div>
    </>
  );
}
