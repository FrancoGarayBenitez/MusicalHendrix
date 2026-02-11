import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import Carousel from "../components/common/Carousel";
import { SliderImage } from "../types/types";
import "./HomePage.css";

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

      // ✅ Mostrar notificación (puedes usar un toast o modal)
      alert("✅ ¡Pago procesado exitosamente! Tu pedido ha sido confirmado.");

      // ✅ Limpiar query params
      setSearchParams({});
    } else if (paymentStatus === "failure") {
      console.log("❌ Pago fallido detectado");

      // ✅ Mostrar mensaje de error
      alert("❌ El pago no pudo ser procesado. Por favor, intenta nuevamente.");

      // ✅ Limpiar query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="home-page">
      <section className="hero">
        <h1 className="hero-title">🎸 Musical Hendrix</h1>
        <Carousel
          images={carouselImages}
          autoPlayInterval={6000}
          height={400}
        />
      </section>

      <section className="about-section">
        <div className="about-content">
          <h2>Sobre nosotros</h2>
          <p>
            Musical Hendrix es una tienda de instrumentos musicales con más de
            15 años de experiencia. Tenemos el conocimiento y la capacidad para
            informarte acerca de las mejores elecciones para tu compra musical.
          </p>

          <div className="cta-buttons">
            <Link to="/productos" className="cta-button primary">
              🎵 Ver nuestros productos
            </Link>
            <Link to="/donde-estamos" className="cta-button secondary">
              📍 Visítanos
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="feature">
          <div className="feature-icon">🎸</div>
          <h3>Gran variedad</h3>
          <p>
            Contamos con una amplia gama de instrumentos para todos los niveles
            y estilos musicales.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">🚚</div>
          <h3>Envíos a todo el país</h3>
          <p>
            Realizamos envíos a todo el territorio argentino, muchos con costo
            gratis.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">🛠️</div>
          <h3>Servicio técnico</h3>
          <p>
            Ofrecemos servicio de mantenimiento y reparación para tus
            instrumentos.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
