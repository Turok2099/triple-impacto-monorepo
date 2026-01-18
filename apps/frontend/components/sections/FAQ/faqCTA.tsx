export default function FAQCTASection() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* CTA para visitar FAQs */}
        <div className="text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            ¿Tienes alguna pregunta?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
            Encuentra respuestas a las preguntas más frecuentes sobre cómo
            funciona Club Triple Impacto
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/faqs"
              className="inline-block px-8 py-4 bg-linear-to-r from-emerald-600 to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Ver preguntas frecuentes
            </a>
            <a
              href="/contact"
              className="inline-block px-8 py-4 bg-white text-gray-800 font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border-2 border-gray-200 hover:border-emerald-300"
            >
              Contactar soporte
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
