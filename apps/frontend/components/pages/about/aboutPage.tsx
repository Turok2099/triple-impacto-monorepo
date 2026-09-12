import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  HandCoins,
  Handshake,
  Gift,
  Repeat,
  RefreshCw,
  Heart,
  HeartHandshake,
  Sparkles,
  Building2,
  TrendingUp,
  Users2,
  Leaf,
  Quote,
} from "lucide-react";

export default function AboutPage() {
  const pasos = [
    {
      icon: Heart,
      title: "Elegís una causa",
      description: "Encontrás una ONG cuyo propósito te represente.",
    },
    {
      icon: HeartHandshake,
      title: "Te sumás al club",
      description: "Tu aporte mensual ayuda a sostener su misión.",
    },
    {
      icon: Gift,
      title: "Disfrutás tus beneficios",
      description: "Accedés a descuentos en marcas para tu día a día.",
    },
  ];

  const circuloBienestar = [
    { icon: HandCoins, label: "Vos aportás" },
    { icon: Handshake, label: "Una ONG recibe apoyo" },
    { icon: Gift, label: "Accedés a beneficios" },
    { icon: Repeat, label: "El bienestar circula" },
  ];

  const bienestar = [
    {
      icon: Sparkles,
      color: "teal",
      title: "Bienestar personal",
      description: "Beneficios y ahorro para cada socio.",
    },
    {
      icon: HeartHandshake,
      color: "rose",
      title: "Bienestar social",
      description:
        "Apoyo sostenido a las ONGs y a las comunidades que acompañan.",
    },
    {
      icon: Building2,
      color: "blue",
      title: "Bienestar corporativo",
      description:
        "Una forma de que las empresas cuiden a sus equipos y participen en su comunidad.",
    },
  ];

  const dimensionesImpacto = [
    {
      icon: TrendingUp,
      title: "Económico",
      description:
        "Ingresos sostenidos para que las ONGs puedan planificar y crecer.",
    },
    {
      icon: Users2,
      title: "Social",
      description:
        "Más y mejor acompañamiento para las personas a las que asisten.",
    },
    {
      icon: Leaf,
      title: "Ambiental",
      description:
        "Apoyo a las causas que trabajan por cuidar al planeta y a sus habitantes.",
    },
  ];

  const colorClasses: Record<string, string> = {
    teal: "bg-teal-100/50 text-teal-600 group-hover:bg-teal-100",
    rose: "bg-rose-100/50 text-rose-600 group-hover:bg-rose-100",
    blue: "bg-blue-100/50 text-blue-600 group-hover:bg-blue-100",
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Volver al inicio */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {/* 1. Apertura: qué es el club */}
        <section className="relative max-w-4xl mx-auto text-center mb-28">
          <div
            aria-hidden
            className="absolute -top-16 -left-12 w-56 h-56 bg-teal-200/40 rounded-full blur-3xl -z-10"
          />
          <div
            aria-hidden
            className="absolute -top-8 -right-8 w-56 h-56 bg-amber-200/30 rounded-full blur-3xl -z-10"
          />

          <div className="inline-flex items-center justify-center bg-[#2c8184] rounded-3xl px-8 py-6 sm:px-12 sm:py-8 mb-8 shadow-[0_15px_40px_rgb(44,129,132,0.25)]">
            <Image
              src="https://res.cloudinary.com/dxbtafe9u/image/upload/v1789230698/ISOLOGOTIPO_BLANCO_CLUB_TRIPLE_IMPACTO_FONDO_TRANSPARENTE_wxyw9l.png"
              alt="Club Triple Impacto"
              width={480}
              height={170}
              priority
              className="h-16 sm:h-20 md:h-24 w-auto max-w-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Todo lo que das,{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-500 to-teal-700">
              vuelve multiplicado
            </span>
            .
          </h1>
          <div className="mb-10 space-y-6 text-lg leading-relaxed text-gray-600 md:text-xl">
            <p>
              En Club Triple Impacto conectamos personas, empresas y ONGs para
              crear{" "}
              <strong className="font-semibold">Bienestar Circular</strong>. Al
              sumarte, de forma individual o a través de tu empresa, tu aporte
              mensual te permite disfrutar de descuentos y beneficios para tu
              día a día, mientras acompañás a la ONG que elegiste y ayudás a
              sostener su propósito.
            </p>

            <p>
              Creemos que cuidarte a vos y cuidar a otros pueden ser parte del
              mismo camino. Por eso, transformamos un aporte en bienestar para
              las personas, apoyo para las comunidades y oportunidades para
              acompañar causas que cuidan al planeta. Un círculo en el que cada
              persona y cada empresa pueden hacer que el bienestar crezca y
              llegue más lejos.
            </p>
          </div>
          <Link
            href="/donar"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-[#2c8184] rounded-full transition-all hover:-translate-y-1 hover:shadow-xl hover:bg-[#256e70]"
          >
            Quiero ser parte
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* 2. Bienestar Circular: el corazón de la propuesta */}
        <section className="mb-28 grid md:grid-cols-5 gap-10 md:gap-14 items-center max-w-6xl mx-auto">
          <div className="md:col-span-2 order-2 md:order-1">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-teal-200" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center text-center px-1">
                  <RefreshCw
                    className="w-9 h-9 text-[#2c8184] animate-[spin_12s_linear_infinite]"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              {circuloBienestar.map((paso, i) => {
                const IconComponent = paso.icon;
                const posiciones = [
                  "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
                  "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
                  "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
                  "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
                ];
                return (
                  <div
                    key={i}
                    className={`absolute ${posiciones[i]} flex flex-col items-center gap-2 w-24`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-teal-100 shadow-[0_8px_20px_rgb(0,0,0,0.06)] flex items-center justify-center shrink-0">
                      <IconComponent
                        className="w-5 h-5 text-[#2c8184]"
                        strokeWidth={1.75}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                      {paso.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-3 order-1 md:order-2 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Cuidarte también es{" "}
              <span className="text-[#2c8184]">cuidar a otros</span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Con tu aporte mensual disfrutás de beneficios para tu día a día y
              acompañás a una ONG para que continúe con su propósito. Así
              creamos{" "}
              <strong className="text-teal-700 font-bold">
                Bienestar Circular
              </strong>
              : una forma de conectar tu bienestar con el de los demás.
            </p>
          </div>
        </section>

        {/* 3. Cómo funciona: aporte con beneficios */}
        <section className="mb-16">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Aporte con beneficios
            </h2>
            <div className="w-16 h-1.5 bg-[#2c8184] mx-auto rounded-full" />
          </div>

          <ol className="relative grid md:grid-cols-3 gap-12 md:gap-10 max-w-6xl mx-auto">
            <div
              aria-hidden
              className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-0.5 bg-teal-100"
            />

            {pasos.map((paso, index) => {
              const IconComponent = paso.icon;
              return (
                <li
                  key={index}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 w-20 h-20 rounded-2xl bg-white border-2 border-teal-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center mb-6">
                    <IconComponent
                      className="w-9 h-9 text-[#2c8184]"
                      strokeWidth={1.5}
                    />
                    <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#2c8184] text-white text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {paso.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed max-w-xs">
                    {paso.description}
                  </p>
                </li>
              );
            })}
          </ol>

          <p className="text-center text-gray-600 max-w-2xl mx-auto mt-14">
            También podés ser parte a través de tu empresa, si ofrece el club
            como beneficio para su equipo.
          </p>
        </section>

        {/* 4. El alcance: bienestar e impacto */}
        <section className="mb-16">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Un círculo que nos conecta
            </h2>
            <div className="w-16 h-1.5 bg-[#2c8184] mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {bienestar.map((item, i) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-teal-200 hover:shadow-lg transition-all duration-300 group"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${colorClasses[item.color]}`}
                  >
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tres dimensiones de impacto */}
        <section className="mb-28">
          <div className="max-w-5xl mx-auto bg-teal-50/60 rounded-3xl px-6 py-10 sm:px-10">
            <h3 className="text-center text-xl sm:text-2xl font-bold text-gray-900 mb-10">
              Tres dimensiones de impacto
            </h3>
            <div className="grid sm:grid-cols-3 gap-8">
              {dimensionesImpacto.map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#2c8184]">
                      <IconComponent className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Cierre: la convicción y la invitación */}
        <section className="max-w-3xl mx-auto text-center">
          <Quote className="w-8 h-8 text-teal-400 mx-auto mb-6" aria-hidden />
          <blockquote className="text-xl sm:text-2xl font-semibold text-gray-800 leading-relaxed mb-4">
            Cada vez que compramos y vendemos, elegimos el mundo en el que
            queremos vivir.
          </blockquote>
          <p className="text-lg text-gray-600 leading-relaxed mb-10">
            Queremos que cuidarte a vos, cuidar a otros y cuidar al planeta sean
            parte del mismo camino.
          </p>

          <div className="bg-linear-to-r from-teal-600 to-teal-700 rounded-3xl px-8 py-12 shadow-[0_15px_40px_rgb(44,129,132,0.25)] flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/donar"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-[#2c8184] bg-white rounded-full transition-all hover:-translate-y-1 hover:shadow-xl w-full sm:w-auto"
            >
              Quiero ser socio
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white border-2 border-white/70 rounded-full transition-all hover:-translate-y-1 hover:bg-white/10 w-full sm:w-auto"
            >
              Quiero sumar a mi empresa
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
