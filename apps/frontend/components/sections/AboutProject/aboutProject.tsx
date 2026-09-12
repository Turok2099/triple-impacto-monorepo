import { HeartHandshake, Ticket, TrendingUp } from "lucide-react";

export default function AboutProjectSection() {
  const cards = [
    {
      icon: <HeartHandshake className="w-8 h-8 text-[#2c8184]" />,
      title: "Bienestar Circular",
      description:
        "Creemos que todo el bienestar que das —a una ONG, a una comunidad, al planeta— te tiene que volver multiplicado en beneficios para tu día a día. Nada se pierde: todo circula y crece.",
    },
    {
      icon: <Ticket className="w-8 h-8 text-[#2c8184]" />,
      title: "Aporte con Beneficios",
      description:
        "Al sumarte, no solo acompañás a la ONG que elegiste y hacés posible que continúe con su propósito: también accedés a descuentos exclusivos en las mejores marcas del país.",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-[#2c8184]" />,
      title: "Impacto Circular",
      description:
        "Las ONGs logran sostener su misión, las empresas viven un compromiso genuino con su comunidad y vos ahorrás todos los meses usando tus beneficios. Un impacto económico, social y ambiental. ¡Ganamos todos!",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm cursor-default mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2c8184] to-teal-400">
              CLUB TRIPLE IMPACTO.
            </span>{" "}
            <span className="text-gray-800">
              TODO LO QUE DAS, VUELVE MULTIPLICADO.
            </span>
          </h2>

          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Club Triple Impacto es una plataforma que conecta a ONGs, empresas y
            personas en un ecosistema colaborativo. Queremos que aportar a una
            causa justa deje de ser un esfuerzo y pase a ser una decisión
            inteligente para vos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#2c8184]/30 hover:shadow-lg hover:shadow-[#2c8184]/5 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {card.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
