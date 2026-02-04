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
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 relative">
      {/* Bloque superior: imagen de fondo */}
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
        {/* Nombre de la marca: esquina superior derecha, blanco con texto negro */}
        <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full bg-white text-black text-sm font-medium shadow-md">
          {cupon.empresa.nombre}
        </div>
      </div>

      {/* Logo: bloque cuadrado (alto = ancho), imagen ajustada solo al ancho del bloque */}
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

      {/* Contenido debajo de la imagen (padding para no quedar bajo el logo) */}
      <div className="relative z-0 pt-16 sm:pt-20 pb-5 px-5 text-center">
        {/* Descuento destacado */}
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {cupon.descuento}
        </p>
        {/* Descripción en gris */}
        <p className="text-sm text-gray-500 line-clamp-2">{descripcion}</p>
        {/* CTA */}
        <button className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm">
          Ver detalles
        </button>
      </div>
    </div>
  );
}
