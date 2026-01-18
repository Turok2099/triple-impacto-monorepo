export default function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Eligí el proyecto que más te importa",
      description:
        "ONGs verificadas y transparentes. Descubrí proyectos de ONGs con impacto verdadero.",
    },
    {
      number: "2",
      title: "Creá tu cuenta y hacé tu donación Fácil y sin complicaciones. ",
      description:
        "Al instante, sin trámites. Accedé a tus beneficios desde donde quieras.",
    },
    {
      number: "3",
      title: "Usá tu cuponera mientras generás impacto.",
      description:
        "Usá tus beneficios en más de 2,000 comercios. Disfrutá descuentos exclusivos y recordá que cada compra ya generó un cambio positivo en la sociedad y el ambiente.",
    },
  ];

  return (
    <section id="works" className="relative bg-gray-50 py-10 sm:py-16 lg:py-24">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mx-auto">
            ¿Cómo funciona?
          </h2>
          <p className="max-w-2xl mx-auto mt-4 text-xl text-gray-600 leading-relaxed">
            En solo 3 simples pasos, ya estás generando impacto positivo en la
            sociedad y el ambiente y recibiendo beneficios por ser solidario.
          </p>
        </div>

        <div className="relative mt-12 lg:mt-20">
          {/* Línea punteada curva conectora */}
          <div className="absolute inset-x-0 hidden xl:px-44 top-2 md:block md:px-20 lg:px-28">
            <img
              alt="Línea conectora"
              loading="lazy"
              width="1000"
              height="500"
              decoding="async"
              className="w-full opacity-30"
              style={{ color: "transparent" }}
              src="https://cdn.rareblocks.xyz/collection/celebration/images/steps/2/curved-dotted-line.svg"
            />
          </div>

          {/* Grid de pasos */}
          <div className="relative grid grid-cols-1 text-center gap-y-12 md:grid-cols-3 gap-x-12">
            {steps.map((step, index) => (
              <div key={index}>
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-[#16a459] border-2 border-[#16a459] rounded-full shadow-lg">
                  <span className="text-xl font-semibold text-white">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-6 text-lg text-gray-900 font-semibold leading-tight md:mt-10">
                  {step.title}
                </h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
