"use client";

import { CuponDto } from "@/lib/types/cupon";

interface CuponCardProps {
  cupon: CuponDto;
}

export default function CuponCard({ cupon }: CuponCardProps) {
  // Imagen por defecto usando data URI (imagen placeholder simple)
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='190' viewBox='0 0 280 190'%3E%3Crect fill='%2310b981' width='280' height='190'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='16' fill='%23fff' text-anchor='middle' dy='.3em'%3ECupón%3C/text%3E%3C/svg%3E";
  
  const defaultLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Ccircle fill='%23059669' cx='45' cy='45' r='45'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='24' fill='%23fff' text-anchor='middle' dy='.3em'%3E🎁%3C/text%3E%3C/svg%3E";

  const imagenPrincipal = cupon.imagenes.principal?.["280x190"] || 
    cupon.imagenes.thumbnail?.["90x90"] || 
    defaultImage;
  
  const logoEmpresa = cupon.empresa.logoThumbnail?.["90x90"] || defaultLogo;

  const tieneCodigo = cupon.incluirCodigo === "1" && cupon.envio?.codigo;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-emerald-200 group">
      {/* Imagen principal */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-emerald-500 to-blue-500">
        <img
          src={imagenPrincipal}
          alt={cupon.nombre}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = defaultImage;
          }}
        />
        {/* Badge de descuento */}
        <div className="absolute top-4 left-4 bg-emerald-600 text-white font-bold px-4 py-2 rounded-full shadow-lg">
          {cupon.descuento}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Header con logo de empresa */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={logoEmpresa}
            alt={cupon.empresa.nombre}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultLogo;
            }}
          />
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {cupon.nombre}
            </h3>
            <p className="text-sm text-gray-600">{cupon.empresa.nombre}</p>
          </div>
        </div>

        {/* Nota: Información de envío (códigos, fechas, mensajes) 
            solo se muestra para usuarios logueados que ya han adquirido los cupones.
            En la landing pública, esta información NO se muestra. */}

        {/* CTA */}
        <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform group-hover:scale-105 shadow-lg hover:shadow-xl">
          Ver detalles →
        </button>
      </div>
    </div>
  );
}
