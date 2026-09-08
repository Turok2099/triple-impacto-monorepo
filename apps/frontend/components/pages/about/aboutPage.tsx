import { Heart, Gift, RefreshCw, ArrowRight, ArrowLeft, Quote } from "lucide-react";

export default function AboutPage() {
  const steps = [
    {
      icon: Heart,
      title: "Paso 1",
      description: "Doná a causas socioambientales que te importen.",
    },
    {
      icon: Gift,
      title: "Paso 2",
      description: "Recibí beneficios tangibles a cambio.",
    },
    {
      icon: RefreshCw,
      title: "Paso 3",
      description: "Creá un ciclo de reciprocidad que hace que el impacto sea sostenible y escalable.",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Volver al inicio */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#2c8184] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al inicio</span>
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">

        {/* Propósito - Hero */}
        <section className="relative max-w-4xl mx-auto text-center mb-24">
          <div aria-hidden className="absolute -top-16 -left-12 w-56 h-56 bg-teal-200/40 rounded-full blur-3xl -z-10" />
          <div aria-hidden className="absolute -top-8 -right-8 w-56 h-56 bg-amber-200/30 rounded-full blur-3xl -z-10" />

          <span className="inline-block text-xs font-bold tracking-widest text-[#2c8184] uppercase bg-teal-50 px-4 py-1.5 rounded-full mb-6">
            Sobre nosotros
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Nuestro <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-teal-700">Propósito</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            <strong className="text-gray-900 font-bold">Club Triple Impacto</strong>{" "}
            es una plataforma que promueve la reciprocidad y el apoyo mutuo, inspirada en el concepto ancestral andino de &quot;ayni&quot;, que significa &quot;reciprocidad&quot; o &quot;intercambio mutuo&quot;. La plataforma conecta a personas con ONGs y causas socioambientales, permitiendo donaciones, voluntariado digital y acceso a descuentos exclusivos, con el objetivo de crear una comunidad que genere un impacto positivo en la sociedad y el ambiente, promoviendo la solidaridad, la empatía y la reciprocidad.
          </p>
        </section>

        {/* El bien que vuelve */}
        <section className="mb-28 grid md:grid-cols-5 gap-10 md:gap-14 items-center max-w-6xl mx-auto">
          <div className="md:col-span-2 flex justify-center">
            <div className="relative w-44 h-44 md:w-56 md:h-56 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-teal-100 to-teal-50" />
              <RefreshCw className="relative w-20 h-20 text-[#2c8184] animate-[spin_12s_linear_infinite]" strokeWidth={1.25} />
            </div>
          </div>

          <div className="md:col-span-3 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              El bien que <span className="text-[#2c8184]">vuelve</span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Imaginate un mundo donde cada acción cuenta, donde el bien que hacés a otros regresa de manera multiplicada.
            </p>
            <blockquote className="relative border-l-4 border-[#2c8184] bg-teal-50/60 rounded-r-2xl pl-7 pr-5 py-5">
              <Quote className="absolute -top-3 -left-3 w-6 h-6 text-teal-400 bg-white rounded-full p-1 shadow-sm" aria-hidden />
              <p className="text-gray-800 leading-relaxed">
                En Club Triple Impacto, creemos en la filosofía ancestral andina de <strong className="text-teal-700 font-bold">&quot;Ayni&quot;</strong>, que significa &quot;el bien que vuelve&quot;.
              </p>
            </blockquote>
            <p className="font-medium text-gray-900">
              Nuestra plataforma <span className="text-[#2c8184] font-bold">Fintech de Reciprocidad</span> combina tecnología y propósito para revolucionar la forma en que las personas y empresas generan impacto socioambiental.
            </p>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mb-28">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">¿Cómo funciona?</h2>
            <div className="w-16 h-1.5 bg-[#2c8184] mx-auto rounded-full" />
          </div>

          <ol className="relative grid md:grid-cols-3 gap-12 md:gap-10 max-w-6xl mx-auto">
            <div aria-hidden className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-0.5 bg-teal-100" />

            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <li key={index} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 w-20 h-20 rounded-2xl bg-white border-2 border-teal-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center mb-6">
                    <IconComponent className="w-9 h-9 text-[#2c8184]" strokeWidth={1.5} />
                    <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#2c8184] text-white text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#2c8184] uppercase tracking-widest mb-3">
                    {step.title}
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto text-center bg-linear-to-r from-teal-600 to-teal-700 rounded-3xl px-8 py-14 shadow-[0_15px_40px_rgb(44,129,132,0.25)]">
          <a
            href="/ongs"
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-[#2c8184] bg-white rounded-full transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            Empezá a donar hoy
            <ArrowRight className="w-6 h-6 ml-3" />
          </a>
        </section>

      </div>
    </div>
  );
}
