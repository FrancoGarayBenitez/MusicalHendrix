import { useState, useEffect } from "react";
import { SliderImage } from "../../types/types";

interface SimpleCarouselProps {
  images: SliderImage[];
  autoPlayInterval?: number;
  height?: number;
}

const SimpleCarousel: React.FC<SimpleCarouselProps> = ({
  images,
  autoPlayInterval = 5000,
  height = 400,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-play
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [images.length, autoPlayInterval]);

  const nextSlide = () => {
    setActiveIndex((current) => (current + 1) % images.length);
  };

  const prevSlide = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-200 text-slate-500 rounded-lg"
        style={{ height: `${height}px` }}
      >
        No hay imágenes disponibles
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-slate-900 shadow-2xl"
      style={{ height: `${height}px` }}
    >
      {/* Container de imágenes */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === activeIndex
                ? "opacity-100 transform scale-100"
                : "opacity-0 transform scale-105"
            }`}
          >
            <div className="relative w-full h-full">
              <img
                src={image.url}
                alt={image.alt}
                onError={(e) => {
                  console.error(`Error loading image: ${image.url}`);
                  e.currentTarget.src =
                    "https://via.placeholder.com/1200x400/2c3e50/ffffff?text=Error+Loading+Image";
                }}
                className="w-full h-full object-cover object-center"
              />

              {/* Overlay gradient para mejor legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

              {/* Caption */}
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow-lg">
                      {image.caption}
                    </h3>
                    {image.description && (
                      <p className="text-lg md:text-xl opacity-90 drop-shadow-md max-w-2xl">
                        {image.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controles de navegación */}
      {images.length > 1 && (
        <>
          {/* Botón anterior */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-200 flex items-center justify-center group shadow-lg"
            aria-label="Imagen anterior"
          >
            <svg
              className="w-6 h-6 transform group-hover:-translate-x-0.5 transition-transform"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Botón siguiente */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-200 flex items-center justify-center group shadow-lg"
            aria-label="Imagen siguiente"
          >
            <svg
              className="w-6 h-6 transform group-hover:translate-x-0.5 transition-transform"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Indicadores de posición */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === activeIndex
                    ? "bg-white shadow-lg scale-125"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SimpleCarousel;
