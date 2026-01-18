"use client";

import { useState } from "react";
import {
  Gift,
  Mail,
  Clock,
  Target,
  DollarSign,
  RefreshCw,
} from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: "¿Por qué recibo descuentos por donar?",
    answer:
      "Nuestro modelo de Triple Impacto conecta tu generosidad con comercios aliados que creen en la responsabilidad social. Ellos ofrecen descuentos exclusivos como reconocimiento a tu compromiso con el cambio social. Así, tu donación genera impacto positivo y tú recibes beneficios tangibles.",
    icon: Gift,
  },
  {
    id: 2,
    question: "¿Cómo recibo mis cupones?",
    answer:
      "Los cupones se envían automáticamente a tu correo electrónico inmediatamente después de confirmar tu donación. También puedes acceder a todos tus beneficios desde tu dashboard personal en cualquier momento. Los cupones incluyen códigos únicos y condiciones de uso claras.",
    icon: Mail,
  },
  {
    id: 3,
    question: "¿Qué pasa si no uso el cupón?",
    answer:
      "No hay problema. Los cupones tienen una validez que aparece claramente indicada (generalmente de 30 a 90 días). Si no los usas, no pierdes nada: tu donación ya generó el impacto social que buscabas. Los descuentos son un beneficio adicional, no una obligación.",
    icon: Clock,
  },
  {
    id: 5,
    question: "¿Qué proyectos apoyo con mi donación?",
    answer:
      "Puedes elegir el proyecto específico que quieres apoyar: educación, salud, vivienda, alimentación, entre otros. Cada proyecto incluye descripción detallada, objetivos y reportes de impacto. También ofrecemos la opción de que tu donación se distribuya automáticamente según las necesidades más urgentes.",
    icon: Target,
  },
  {
    id: 6,
    question: "¿Cuál es el monto mínimo para donar?",
    answer:
      "Puedes donar desde $5.000 en adelante. Creemos que cada aporte cuenta y genera impacto. Los beneficios y descuentos están disponibles desde la primera donación, independientemente del monto.",
    icon: DollarSign,
  },
  {
    id: 8,
    question: "¿Puedo cancelar mis donaciones recurrentes?",
    answer:
      "Absolutamente. Si elegiste donar de forma recurrente (mensual), puedes cancelar en cualquier momento desde tu dashboard sin penalidades ni preguntas. Tienes control total sobre tus donaciones.",
    icon: RefreshCw,
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(1);

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Preguntas frecuentes
          </h2>
          <p className="text-xl text-gray-600">
            Todo lo que necesitás saber sobre cómo funciona Club Triple Impacto
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-gray-100"
              style={{
                animation: `slideInUp 0.4s ease-out ${index * 0.05}s both`,
              }}
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="shrink-0 w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <faq.icon
                      className="w-6 h-6 text-emerald-600"
                      strokeWidth={2}
                    />
                  </div>
                  <span className="font-semibold text-gray-900 text-lg pr-4">
                    {faq.question}
                  </span>
                </div>
                <svg
                  className={`w-6 h-6 text-gray-500 shrink-0 transition-transform duration-300 ${
                    openId === faq.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Answer */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  openId === faq.id
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-5 pt-2">
                  <div className="pl-14 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA adicional */}
        <div className="mt-12 text-center bg-white rounded-2xl p-10 shadow-lg border-2 border-gray-100">
          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ¿Tienes otra pregunta?
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Nuestro equipo está disponible para ayudarte en cualquier momento
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-linear-to-r from-emerald-600 to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            Ir al formulario de contacto
          </a>
        </div>
      </div>
    </section>
  );
}
