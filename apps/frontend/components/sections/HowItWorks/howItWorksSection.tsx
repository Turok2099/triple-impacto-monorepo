import { HeartHandshake, Ticket, RefreshCw } from "lucide-react";

const steps = [
  {
    icon: HeartHandshake,
    title: "Elegí una ONG y una causa socioambiental que te importe.",
  },
  {
    icon: Ticket,
    title: "Recibí beneficios tangibles a cambio: descuentos reales para tu día a día.",
  },
  {
    icon: RefreshCw,
    title:
      "Generá Bienestar Circular: un ciclo donde tu bienestar se conecta con el de los demás.",
  },
];

interface HowItWorksSectionProps {
  className?: string;
}

export default function HowItWorksSection({
  className = "bg-gray-50 py-10 sm:py-16 lg:py-24",
}: HowItWorksSectionProps) {
  return (
    <section id="works" className={`relative ${className}`}>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl sm:text-5xl font-bold text-gray-900">
          ¿Cómo funciona?
        </h2>

        <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mt-10 lg:mt-16 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={index}
                className="flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 bg-white rounded-2xl border border-gray-100 shadow-md p-5 md:p-8 hover:shadow-lg transition-shadow"
              >
                <div className="shrink-0 w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-teal-50 flex items-center justify-center md:mb-6">
                  <Icon
                    className="w-7 h-7 md:w-10 md:h-10 text-[#2c8184]"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <span className="inline-block text-xs font-bold tracking-widest text-[#2c8184] mb-1 md:mb-3">
                    PASO {index + 1}
                  </span>
                  <p className="text-base md:text-lg font-semibold text-gray-900 leading-snug">
                    {step.title}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
