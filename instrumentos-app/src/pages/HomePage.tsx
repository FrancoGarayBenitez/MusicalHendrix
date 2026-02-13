import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import Carousel from "../components/common/Carousel";
import { SliderImage } from "../types/types";

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ Imágenes del carrusel
  const carouselImages: SliderImage[] = [
    {
      id: 1,
      url: "/images/slider1.jpg",
      alt: "Instrumentos musicales de percusión",
      caption: "Ritmo y emoción en cada golpe",
      description: "Baterías, tambores, platillos y más para todo nivel",
    },
    {
      id: 2,
      url: "/images/slider2.jpg",
      alt: "Instrumentos musicales de cuerda",
      caption: "Descubre nuestra colección de instrumentos de cuerda",
      description: "Guitarras, violines, bajos y mucho más",
    },
  ];

  // ✅ Detectar pago exitoso desde query params (en lugar de localStorage)
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");

    if (paymentStatus === "success") {
      console.log("✅ Pago exitoso detectado");
      alert("✅ ¡Pago procesado exitosamente! Tu pedido ha sido confirmado.");
      setSearchParams({});
    } else if (paymentStatus === "failure") {
      console.log("❌ Pago fallido detectado");
      alert("❌ El pago no pudo ser procesado. Por favor, intenta nuevamente.");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-1 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Título elegante */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-1 bg-gradient-to-r from-transparent to-musical-teal rounded-full"></div>
                <span className="text-4xl">🎸</span>
                <div className="w-12 h-1 bg-gradient-to-r from-musical-teal to-transparent rounded-full"></div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-musical-slate via-musical-teal to-musical-slate bg-clip-text text-transparent mb-4 tracking-tight">
              Musical Hendrix
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
              Tu destino para encontrar el{" "}
              <span className="font-semibold text-musical-teal">
                instrumento perfecto
              </span>
            </p>
          </div>

          {/* Carousel */}
          <div className="max-w-6xl mx-auto">
            <Carousel
              images={carouselImages}
              autoPlayInterval={6000}
              height={500}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center mb-8">
            <div className="w-8 h-1 bg-musical-teal rounded-full mr-4"></div>
            <h2 className="text-4xl font-bold text-musical-slate">
              Sobre nosotros
            </h2>
            <div className="w-8 h-1 bg-musical-teal rounded-full ml-4"></div>
          </div>

          <p className="text-lg text-slate-600 leading-relaxed mb-12 max-w-3xl mx-auto">
            Musical Hendrix es una tienda de instrumentos musicales con más de
            <span className="font-semibold text-musical-teal">
              {" "}
              15 años de experiencia
            </span>
            . Tenemos el conocimiento y la capacidad para informarte acerca de
            las mejores elecciones para tu compra musical.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="/productos"
              className="inline-flex items-center bg-gradient-to-r from-musical-slate to-musical-teal text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-lg group"
            >
              <span className="mr-2 text-xl group-hover:scale-110 transition-transform">
                🎵
              </span>
              Ver nuestros productos
            </Link>
            <Link
              to="/donde-estamos"
              className="inline-flex items-center bg-white text-musical-slate font-bold px-8 py-4 rounded-xl shadow-lg border-2 border-musical-slate hover:bg-musical-slate hover:text-white hover:-translate-y-1 transition-all duration-200 text-lg group"
            >
              <span className="mr-2 text-xl group-hover:scale-110 transition-transform">
                📍
              </span>
              Visítanos
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-8">
              <div className="w-8 h-1 bg-musical-teal rounded-full mr-4"></div>
              <h2 className="text-4xl font-bold text-musical-slate">
                ¿Por qué elegir Musical Hendrix?
              </h2>
              <div className="w-8 h-1 bg-musical-teal rounded-full ml-4"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300 bg-white rounded-xl p-8 shadow-lg hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-musical-teal to-blue-500 text-white text-4xl rounded-full mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                🎸
              </div>
              <h3 className="text-2xl font-bold text-musical-slate mb-4">
                Gran variedad
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Contamos con una amplia gama de instrumentos para todos los
                niveles y estilos musicales.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300 bg-white rounded-xl p-8 shadow-lg hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-musical-success to-green-500 text-white text-4xl rounded-full mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                🚚
              </div>
              <h3 className="text-2xl font-bold text-musical-slate mb-4">
                Envíos a todo el país
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Realizamos envíos a todo el territorio argentino, muchos con
                costo gratis.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group hover:scale-105 transition-transform duration-300 bg-white rounded-xl p-8 shadow-lg hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-musical-warning to-orange-500 text-white text-4xl rounded-full mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                🛠️
              </div>
              <h3 className="text-2xl font-bold text-musical-slate mb-4">
                Servicio técnico
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Ofrecemos servicio de mantenimiento y reparación para tus
                instrumentos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-musical-slate to-musical-teal">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            ¿Listo para encontrar tu instrumento ideal?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Explora nuestra colección y descubre el sonido que estás buscando
          </p>
          <Link
            to="/productos"
            className="inline-flex items-center bg-white text-musical-slate font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-lg group"
          >
            <span className="mr-2 text-xl group-hover:scale-110 transition-transform">
              🎵
            </span>
            Explorar productos
            <span className="ml-2 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
