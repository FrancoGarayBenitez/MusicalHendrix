const Footer = () => {
  return (
    <footer className="bg-musical-slate text-white">
      {/* Contenido principal del footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Información de la empresa */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🎸</span>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-musical-teal bg-clip-text text-transparent">
                Musical Hendrix
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed max-w-sm">
              Tienda de instrumentos musicales con más de
              <span className="text-musical-teal font-semibold">
                {" "}
                15 años de experiencia
              </span>
              , brindando la mejor calidad y servicio.
            </p>

            {/* Redes sociales */}
            <div className="flex space-x-4 pt-4">
              <a
                href="#"
                className="w-10 h-10 bg-slate-600 hover:bg-musical-teal rounded-full flex items-center justify-center transition-colors duration-200"
                aria-label="Facebook"
              >
                <span className="text-xl">📘</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-600 hover:bg-musical-teal rounded-full flex items-center justify-center transition-colors duration-200"
                aria-label="Instagram"
              >
                <span className="text-xl">📷</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-600 hover:bg-musical-teal rounded-full flex items-center justify-center transition-colors duration-200"
                aria-label="YouTube"
              >
                <span className="text-xl">📺</span>
              </a>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📞</span>
              Contacto
            </h4>

            <div className="space-y-3 text-slate-300">
              <div className="flex items-start space-x-3">
                <span className="text-musical-teal mt-0.5">📍</span>
                <div>
                  <p className="font-medium">Nuestra ubicación</p>
                  <p className="text-sm">Av. Las Heras y Av. San Martín</p>
                  <p className="text-sm">Ciudad de Mendoza, Argentina</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-musical-teal">☎️</span>
                <div>
                  <p className="font-medium">Teléfono</p>
                  <a
                    href="tel:+542615551234"
                    className="text-sm hover:text-musical-teal transition-colors"
                  >
                    (261) 555-1234
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-musical-teal">✉️</span>
                <div>
                  <p className="font-medium">Email</p>
                  <a
                    href="mailto:info@musicalhendrix.com"
                    className="text-sm hover:text-musical-teal transition-colors"
                  >
                    info@musicalhendrix.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Links útiles */}
          <div className="space-y-4">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">🔗</span>
              Enlaces útiles
            </h4>

            <div className="space-y-2">
              <a
                href="/productos"
                className="block text-slate-300 hover:text-musical-teal transition-colors duration-200 text-sm font-medium"
              >
                📦 Productos
              </a>
              <a
                href="/donde-estamos"
                className="block text-slate-300 hover:text-musical-teal transition-colors duration-200 text-sm font-medium"
              >
                📍 Dónde estamos
              </a>
              <a
                href="#"
                className="block text-slate-300 hover:text-musical-teal transition-colors duration-200 text-sm font-medium"
              >
                🛠️ Servicio técnico
              </a>
              <a
                href="#"
                className="block text-slate-300 hover:text-musical-teal transition-colors duration-200 text-sm font-medium"
              >
                📋 Términos y condiciones
              </a>
              <a
                href="#"
                className="block text-slate-300 hover:text-musical-teal transition-colors duration-200 text-sm font-medium"
              >
                🔒 Política de privacidad
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-slate-600"></div>

      {/* Copyright y créditos */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-slate-400 text-sm text-center md:text-left">
            <p>
              &copy; {new Date().getFullYear()} Musical Hendrix.
              <span className="hidden sm:inline">
                {" "}
                Todos los derechos reservados.
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-4 text-slate-400 text-sm">
            <div className="flex items-center space-x-2">
              <span>🎓</span>
              <span>Laboratorio de Computación 4</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-slate-600"></div>
            <div className="flex items-center space-x-2">
              <span>💻</span>
              <span>Desarrollado con ❤️</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
