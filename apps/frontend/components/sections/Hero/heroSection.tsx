import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Imagen de fondo */}
      <div className="absolute inset-0">
        <Image
          src="https://res.cloudinary.com/dxbtafe9u/image/upload/f_auto,q_auto,w_1920/v1768268779/Fondo_hero_yzustd.png"
          alt="AYNI Hero Background"
          fill
          priority
          fetchPriority="high"
          unoptimized
          className="object-cover object-center"
        />
      </div>

      {/* Overlay oscuro para mejor legibilidad del texto */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Contenido Alineado a la Izquierda */}
          <div className="text-left">
            {/* Título principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Doná y recibí{" "}
              <span className="text-white">
                <br />
                descuentos <br />
                exclusivos
                <br />
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-xl text-white mb-8 leading-relaxed">
              Tu donación apoya proyectos sociales y ambientales y te da acceso
              a cupones de descuento ahorrando más de lo que donás.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/donar"
                className="group px-8 py-4 bg-linear-to-r from-teal-600 to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Quiero donar y obtener descuentos</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>

            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-teal-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>100% transparente</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-teal-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Impacto verificado</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-teal-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Descuentos inmediatos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
