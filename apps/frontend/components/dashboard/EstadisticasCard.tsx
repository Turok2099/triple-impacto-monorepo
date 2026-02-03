'use client';

import { EstadisticasUsuario } from '@/lib/dashboard';

interface EstadisticasCardProps {
  estadisticas: EstadisticasUsuario;
}

export default function EstadisticasCard({
  estadisticas,
}: EstadisticasCardProps) {
  const stats = [
    {
      label: 'Cupones Activos',
      value: estadisticas.cuponesActivos,
      icon: '🎟️',
      color: 'bg-green-100 text-green-800',
    },
    {
      label: 'Cupones Usados',
      value: estadisticas.cuponesUsados,
      icon: '✓',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Total Solicitados',
      value: estadisticas.totalCuponesSolicitados,
      icon: '📊',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      label: 'Total Donado',
      value: estadisticas.totalDonado
        ? `$${estadisticas.totalDonado.toLocaleString('es-AR')}`
        : '$0',
      icon: '💚',
      color: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center text-2xl`}
            >
              {stat.icon}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
