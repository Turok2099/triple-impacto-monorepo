import { useAuth } from "@/contexts/AuthContext";
import PaymentFormRest from "@/components/donar/PaymentFormRest";

export default function SeccionDonacion() {
  const { user } = useAuth();

  return (
    <div className="py-6 w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Hacé tu Donación</h2>
        <p className="text-gray-600">
          Tu aporte genera triple impacto: ayudás a una ONG, cuidás el planeta y obtenés beneficios exclusivos
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 p-8">
        <PaymentFormRest
          onSuccess={(data) => console.log('Éxito REST', data)}
        />
      </div>
    </div>
  );
}
