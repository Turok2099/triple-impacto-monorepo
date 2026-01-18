export default function CouponShowcase() {
  return (
    <section className="relative py-16 sm:py-20 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          {/* Card del Cupón */}
          <div className="relative w-full max-w-md">
            {/* Card de ejemplo de beneficio */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
              <div className="absolute -top-4 -right-4 bg-red-500 text-white font-bold px-4 py-2 rounded-full shadow-lg">
                -30%
              </div>
              <div className="mb-4">
                <div className="w-16 h-16 bg-linear-to-br from-emerald-400 to-blue-400 rounded-xl flex items-center justify-center text-3xl mb-4">
                  🛍️
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Cupón de Descuento
                </h3>
                <p className="text-gray-600 mb-4">
                  Obtén descuentos exclusivos en comercios de Bonda
                </p>
                <div className="border-t-2 border-dashed border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tu donación:</span>
                    <span className="font-bold text-emerald-600">$10.000</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Tu ahorro:</span>
                    <span className="font-bold text-blue-600">$15.000</span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-emerald-800">
                  ¡Ganas más de lo que donas! 💚
                </p>
              </div>
            </div>

            {/* Elementos flotantes */}
            <div className="absolute -top-8 -left-8 bg-white rounded-xl shadow-lg p-4 animate-float">
              <div className="flex items-center gap-2">
                <span className="text-2xl">❤️</span>
                <div className="text-sm">
                  <div className="font-bold text-gray-900">1,250</div>
                  <div className="text-gray-600">Donaciones</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -right-8 bg-white rounded-xl shadow-lg p-4 animate-float animation-delay-2000">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <div className="text-sm">
                  <div className="font-bold text-gray-900">500+</div>
                  <div className="text-gray-600">Beneficios</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
