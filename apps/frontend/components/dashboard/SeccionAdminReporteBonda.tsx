"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  getReporteBondaMensual,
  exportReporteBondaMensual,
  ReporteBondaMensualResponse,
} from "@/lib/admin";
import { getOrganizaciones, Ong } from "@/lib/admin-ongs";
import { BarChart3, Download, Filter, ShieldAlert, Loader2 } from "lucide-react";

function mesActualYYYYMM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatFecha(iso: string | null) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("es-AR");
}

function formatMonto(monto: number | null) {
  if (monto === null || monto === undefined) return "N/A";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto);
}

export default function SeccionAdminReporteBonda() {
  const [desde, setDesde] = useState(mesActualYYYYMM());
  const [hasta, setHasta] = useState(mesActualYYYYMM());
  const [organizacionId, setOrganizacionId] = useState("");
  const [ongs, setOngs] = useState<Ong[]>([]);

  const [reporte, setReporte] = useState<ReporteBondaMensualResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const token = localStorage.getItem("auth_token") || "";
        const data = await getOrganizaciones(token);
        setOngs(data);
      } catch (e) {
        console.error("Error cargando ONGs", e);
      }
    };
    fetchOngs();
  }, []);

  const buscar = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const data = await getReporteBondaMensual(token, desde, hasta, organizacionId || undefined);
      setReporte(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const descargarExcel = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      await exportReporteBondaMensual(token, desde, hasta, organizacionId || undefined);
      Swal.fire({
        title: "¡Listo!",
        text: "El reporte se descargó correctamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error", "No se pudo generar el reporte: " + err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const totales = reporte?.resumen.reduce(
    (acc, fila) => ({
      altas: acc.altas + fila.altas_bonda,
      pagos: acc.pagos + fila.pagos_completados,
      monto: acc.monto + fila.monto_total,
    }),
    { altas: 0, pagos: 0, monto: 0 }
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#2c8184]" /> Reportería Bonda: altas y pagos por mes
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Cruza los usuarios dados de alta en Bonda y los pagos completados en nuestra base de datos, mes a mes.
        </p>
      </div>

      <div className="p-6 border-b border-slate-100 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Desde</label>
          <input
            type="month"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2c8184] outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Hasta</label>
          <input
            type="month"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2c8184] outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">ONG</label>
          <select
            value={organizacionId}
            onChange={(e) => setOrganizacionId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2c8184] outline-none text-sm min-w-[200px]"
          >
            <option value="">Todas las ONGs</option>
            {ongs.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
        </div>
        <button
          onClick={buscar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
        >
          <Filter className="w-4 h-4" /> {loading ? "Buscando..." : "Ver reporte"}
        </button>
        <button
          onClick={descargarExcel}
          disabled={exporting || loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#2c8184] hover:bg-[#1e6063] text-white rounded-xl font-semibold transition-all disabled:opacity-50"
          title="Genera el Excel verificando cada afiliado contra Bonda en vivo; puede tardar varios minutos si hay muchos usuarios en el rango elegido."
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Generando (puede tardar)..." : "Descargar Excel"}
        </button>
      </div>

      {error && (
        <div className="m-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" /> <span>{error}</span>
        </div>
      )}

      {exporting && (
        <div className="mx-6 mt-4 bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-100 text-sm">
          Generando el Excel: estamos verificando cada usuario contra la API de Bonda uno por uno para respetar su límite de consultas.
          Esto puede tardar varios minutos si el rango tiene muchos usuarios — no cierres esta pestaña.
        </div>
      )}

      <div className="p-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Resumen mensual</h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold text-slate-500">Mes</th>
                <th className="py-3 px-4 font-semibold text-slate-500">ONG</th>
                <th className="py-3 px-4 font-semibold text-slate-500 text-right">Altas nuevas en Bonda</th>
                <th className="py-3 px-4 font-semibold text-slate-500 text-right">Pagos completados</th>
                <th className="py-3 px-4 font-semibold text-slate-500 text-right">Monto total donado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reporte?.resumen.length ? (
                reporte.resumen.map((fila, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">{fila.mes}</td>
                    <td className="py-3 px-4">{fila.organizacion_nombre}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#2c8184]">{fila.altas_bonda}</td>
                    <td className="py-3 px-4 text-right">{fila.pagos_completados}</td>
                    <td className="py-3 px-4 text-right">{formatMonto(fila.monto_total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {loading ? "Cargando..." : "Sin datos para el rango seleccionado."}
                  </td>
                </tr>
              )}
            </tbody>
            {totales && reporte?.resumen.length ? (
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-bold bg-slate-50">
                  <td className="py-3 px-4" colSpan={2}>Total</td>
                  <td className="py-3 px-4 text-right">{totales.altas}</td>
                  <td className="py-3 px-4 text-right">{totales.pagos}</td>
                  <td className="py-3 px-4 text-right">{formatMonto(totales.monto)}</td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Detalle (altas en Bonda)</h3>
        <p className="text-xs text-slate-400 mb-3">
          Esta vista muestra los datos que ya tenemos registrados. El Excel descargado además verifica cada fila en vivo contra Bonda.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold text-slate-500">Nombre</th>
                <th className="py-3 px-4 font-semibold text-slate-500">Email</th>
                <th className="py-3 px-4 font-semibold text-slate-500">ONG</th>
                <th className="py-3 px-4 font-semibold text-slate-500">Fecha alta Bonda</th>
                <th className="py-3 px-4 font-semibold text-slate-500">Activo</th>
                <th className="py-3 px-4 font-semibold text-slate-500 text-right">Último pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reporte?.detalle.length ? (
                reporte.detalle.map((fila, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">{fila.nombre}</td>
                    <td className="py-3 px-4">{fila.email}</td>
                    <td className="py-3 px-4">{fila.organizacion_nombre}</td>
                    <td className="py-3 px-4">{formatFecha(fila.fecha_alta_bonda)}</td>
                    <td className="py-3 px-4">
                      {fila.activo_local ? (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-xs font-medium">Activo</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-medium">Inactivo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {fila.ultimo_pago_monto ? formatMonto(fila.ultimo_pago_monto) : "Sin pagos"}
                      {fila.ultimo_pago_fecha ? (
                        <span className="block text-xs text-slate-400">{formatFecha(fila.ultimo_pago_fecha)}</span>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {loading ? "Cargando..." : "Sin altas de Bonda para el rango seleccionado."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
