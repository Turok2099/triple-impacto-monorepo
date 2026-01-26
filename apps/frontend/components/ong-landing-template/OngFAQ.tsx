"use client";

import { useState } from "react";

const faqItems = [
    {
        id: 1,
        question: "¿Cómo puedo hacer una donación?",
        answer:
            "Podés donar de manera segura a través de nuestra plataforma online, transferencia bancaria o en efectivo en nuestras oficinas. Aceptamos donaciones únicas o recurrentes. Todas las donaciones emiten un recibo deducible de impuestos.",
    },
    {
        id: 2,
        question: "¿Cómo se utilizan los fondos donados?",
        answer:
            "El 85% de cada donación va directamente a nuestros programas de campo. El 15% restante se destina a gastos administrativos y de captación de fondos. Publicamos informes anuales de transparencia con el detalle de todos nuestros gastos.",
    },
    {
        id: 3,
        question: "¿Puedo visitar los proyectos en terreno?",
        answer:
            "¡Sí! Organizamos visitas programadas para donantes y voluntarios. Es una excelente oportunidad para conocer de primera mano el impacto de nuestro trabajo. Contactanos para coordinar una visita.",
    },
    {
        id: 4,
        question: "¿La organización está legalmente constituida?",
        answer:
            "Sí, somos una Asociación Civil sin fines de lucro, inscripta en la Inspección General de Justicia. Contamos con personería jurídica y estamos habilitados para recibir donaciones y emitir recibos oficiales.",
    },
];

export default function OngFAQ() {
    const [openId, setOpenId] = useState<number | null>(null);

    const toggleFAQ = (id: number) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
                        FAQ
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Preguntas frecuentes
                    </h2>
                    <p className="text-lg text-gray-600">
                        Encontrá respuestas a las consultas más comunes sobre nuestra
                        organización.
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-4">
                    {faqItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                        >
                            <button
                                type="button"
                                onClick={() => toggleFAQ(item.id)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                                aria-expanded={openId === item.id}
                                aria-controls={`faq-answer-${item.id}`}
                            >
                                <span className="font-semibold text-gray-900 pr-4">
                                    {item.question}
                                </span>
                                <span
                                    className={`flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center transition-transform duration-200 ${openId === item.id ? "rotate-180" : ""
                                        }`}
                                >
                                    <svg
                                        className="w-4 h-4 text-emerald-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </span>
                            </button>

                            <div
                                id={`faq-answer-${item.id}`}
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openId === item.id ? "max-h-96" : "max-h-0"
                                    }`}
                                role="region"
                                aria-labelledby={`faq-question-${item.id}`}
                            >
                                <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-12 text-center">
                    <p className="text-gray-600 mb-4">¿Tenés otra pregunta?</p>
                    <a
                        href="mailto:contacto@ong.org"
                        className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                    >
                        Escribinos
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}
