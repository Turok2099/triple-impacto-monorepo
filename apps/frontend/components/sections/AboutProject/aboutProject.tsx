import { HeartHandshake, Ticket, TrendingUp } from "lucide-react";

export default function AboutProjectSection() {
  const cards = [
    {
      icon: <HeartHandshake className="w-8 h-8 text-[#40a8ab]" />,
      title: "Reciprocidad (Ayni)",
      description: "Inspirados en la filosofía ancestral andina, creemos que toda la ayuda que dás te tiene que volver multiplicada en beneficios para tu día a día."
    },
    {
      icon: <Ticket className="w-8 h-8 text-[#40a8ab]" />,
      title: "Aporte con Beneficios",
      description: "Al donar no solo ayudás a tu ONG favorita, sino podrás usar descuentos exclusivos en las mejores marcas."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-[#40a8ab]" />,
      title: "Impacto Circular",
      description: "Las ONGs logran cumplir sus objetivos, las marcas potencian sus ventas y vos ahorrás miles de pesos todos los meses usando tus cupones. ¡Ganamos todos!"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm cursor-default mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#40a8ab] to-teal-400">
              AYNI.
            </span>
            {" "}
            <span className="text-gray-800">
              LO QUE DAS, VUELVE!
            </span>
          </h2>

          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            AYNI es una plataforma que conecta a ONGs, empresas y personas en un ecosistema colaborativo.
            Queremos que donar a una causa justa deje de ser un esfuerzo y pase a ser una decisión <span className="font-semibold text-slate-800">inteligente</span> para vos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#40a8ab]/30 hover:shadow-lg hover:shadow-[#40a8ab]/5 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
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
