import "./DondeEstamosPage.css";

const DondeEstamosPage = () => {
  // ✅ Coordenadas de la ubicación (Av. Las Heras y Av. San Martín, Mendoza)
  const location = {
    lat: -32.892532,
    lng: -68.8479428,
    address: "Av. Las Heras y Av. San Martín, Ciudad de Mendoza, Argentina",
  };

  const mapSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3350.0458988622567!2d${location.lng}!3d${location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDUzJzMzLjEiUyA2OMKwNTAnNTIuNiJX!5e0!3m2!1ses!2sar!4v1629460242040!5m2!1ses!2sar`;

  return (
    <div className="donde-estamos-page">
      <div className="page-header">
        <h1>📍 Dónde Estamos</h1>
        <p>Visítanos en nuestra tienda física</p>
      </div>

      <div className="map-container">
        <iframe
          src={mapSrc}
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación de Musical Hendrix"
        ></iframe>
      </div>

      <div className="location-info">
        <div className="info-card">
          <div className="info-icon">📞</div>
          <h3>Información de contacto</h3>
          <ul className="info-list">
            <li>
              <strong>Dirección:</strong> {location.address}
            </li>
            <li>
              <strong>Teléfono:</strong>{" "}
              <a href="tel:+542615551234">(261) 555-1234</a>
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:info@musicalhendrix.com">
                info@musicalhendrix.com
              </a>
            </li>
            <li>
              <strong>Horario de atención:</strong>
              <br />
              Lunes a Viernes: 9:00 - 18:00
              <br />
              Sábados: 9:00 - 13:00
            </li>
          </ul>
        </div>

        <div className="info-card">
          <div className="info-icon">🚌</div>
          <h3>Cómo llegar</h3>
          <ul className="info-list">
            <li>
              <strong>En colectivo:</strong> Líneas 101, 102, 103, 501, 502
            </li>
            <li>
              <strong>En auto:</strong> Estacionamiento disponible en la zona
            </li>
            <li>
              <strong>A pie:</strong> A 10 minutos de Plaza Independencia
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DondeEstamosPage;
