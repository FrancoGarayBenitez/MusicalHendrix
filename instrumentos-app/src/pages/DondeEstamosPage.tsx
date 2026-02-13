const DondeEstamosPage = () => {
  // ✅ Coordenadas de la ubicación (Av. Las Heras y Av. San Martín, Mendoza)
  const location = {
    lat: -32.892532,
    lng: -68.8479428,
    address: "Av. Las Heras y Av. San Martín, Ciudad de Mendoza, Argentina",
  };

  const mapSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3350.0458988622567!2d${location.lng}!3d${location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDUzJzMzLjEiUyA2OMKwNTAnNTIuNiJX!5e0!3m2!1ses!2sar!4v1629460242040!5m2!1ses!2sar`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header de la página */}
      <div className="bg-gradient-to-r from-musical-slate to-musical-teal py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-1 bg-gradient-to-r from-transparent to-white rounded-full"></div>
              <span className="text-3xl">📍</span>
              <div className="w-8 h-1 bg-gradient-to-r from-white to-transparent rounded-full"></div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Dónde Estamos
          </h1>

          <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Visítanos en nuestra tienda física en el corazón de Mendoza
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mapa */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-musical-slate flex items-center">
                <span className="mr-3">🗺️</span>
                Nuestra Ubicación
              </h2>
              <p className="text-slate-600 mt-2">
                Encuentra nuestra tienda en una de las ubicaciones más céntricas
                de Mendoza
              </p>
            </div>
            <div className="aspect-video bg-slate-100">
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Musical Hendrix"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información de contacto */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-musical-teal to-musical-slate rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-2xl font-bold text-musical-slate">
                Información de contacto
              </h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-musical-teal/10 text-musical-teal rounded-lg flex items-center justify-center flex-shrink-0">
                  <span>📍</span>
                </div>
                <div>
                  <h4 className="font-semibold text-musical-slate mb-1">
                    Dirección
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {location.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-musical-teal/10 text-musical-teal rounded-lg flex items-center justify-center flex-shrink-0">
                  <span>☎️</span>
                </div>
                <div>
                  <h4 className="font-semibold text-musical-slate mb-1">
                    Teléfono
                  </h4>
                  <a
                    href="tel:+542615551234"
                    className="text-musical-teal hover:text-musical-slate transition-colors duration-200 font-medium"
                  >
                    (261) 555-1234
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-musical-teal/10 text-musical-teal rounded-lg flex items-center justify-center flex-shrink-0">
                  <span>✉️</span>
                </div>
                <div>
                  <h4 className="font-semibold text-musical-slate mb-1">
                    Email
                  </h4>
                  <a
                    href="mailto:info@musicalhendrix.com"
                    className="text-musical-teal hover:text-musical-slate transition-colors duration-200 font-medium"
                  >
                    info@musicalhendrix.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-musical-teal/10 text-musical-teal rounded-lg flex items-center justify-center flex-shrink-0">
                  <span>🕒</span>
                </div>
                <div>
                  <h4 className="font-semibold text-musical-slate mb-2">
                    Horario de atención
                  </h4>
                  <div className="space-y-1 text-slate-600">
                    <p>
                      <strong>Lunes a Viernes:</strong> 9:00 - 18:00
                    </p>
                    <p>
                      <strong>Sábados:</strong> 9:00 - 13:00
                    </p>
                    <p>
                      <strong>Domingos:</strong> Cerrado
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cómo llegar */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-musical-slate to-musical-teal rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">🚌</span>
              </div>
              <h3 className="text-2xl font-bold text-musical-slate">
                Cómo llegar
              </h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-musical-slate/10 text-musical-slate rounded-lg flex items-center justify-center flex-shrink-0">
                  <span>🚌</span>
                </div>
                <div>
                  <h4 className="font-semibold text-musical-slate mb-1">
                    En colectivo
                  </h4>
                  <p className="text-slate-600">
                    <strong>Líneas:</strong> 101, 102, 103, 501, 502
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    Parada más cercana: Las Heras y San Martín
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-musical-slate/10 text-musical-slate rounded-lg flex items-center justify-center flex-shrink-0">
                  <span>🚗</span>
                </div>
                <div>
                  <h4 className="font-semibold text-musical-slate mb-1">
                    En auto
                  </h4>
                  <p className="text-slate-600">
                    Estacionamiento disponible en la zona
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    Zona azul y parkings cercanos
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-musical-slate/10 text-musical-slate rounded-lg flex items-center justify-center flex-shrink-0">
                  <span>🚶</span>
                </div>
                <div>
                  <h4 className="font-semibold text-musical-slate mb-1">
                    A pie
                  </h4>
                  <p className="text-slate-600">
                    A 10 minutos de Plaza Independencia
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    Zona céntrica y accesible
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 p-4 bg-gradient-to-r from-musical-teal/10 to-musical-slate/10 rounded-lg border-2 border-dashed border-musical-teal/30">
              <p className="text-musical-slate font-medium text-center mb-3">
                🎵 ¿Tienes alguna consulta antes de visitarnos?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="tel:+542615551234"
                  className="flex-1 bg-musical-slate text-white text-center py-3 px-4 rounded-lg font-bold hover:bg-musical-teal transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  📞 Llamar
                </a>
                <a
                  href="mailto:info@musicalhendrix.com"
                  className="flex-1 bg-white text-musical-teal border-2 border-musical-teal text-center py-2 px-4 rounded-lg font-semibold hover:bg-musical-teal hover:text-white transition-all duration-200"
                >
                  ✉️ Escribir
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DondeEstamosPage;
