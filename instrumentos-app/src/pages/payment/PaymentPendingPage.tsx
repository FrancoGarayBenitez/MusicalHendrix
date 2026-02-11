import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCarritoContext } from "../../context/CarritoContext";
import { verificarEstadoPago } from "../../service/api";
import Loading from "../../components/common/Loading";
import "./PaymentPages.css";

const PaymentPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { limpiarPedidoPendiente } = useCarritoContext();

  const [preferenceId] = useState<string | null>(
    localStorage.getItem("mp_preference_id"),
  );

  const [verificando, setVerificando] = useState(true);
  const [intentos, setIntentos] = useState(0);
  const [maxIntentos] = useState(20); // Aumentado de 12 a 20
  const [mensaje, setMensaje] = useState("Iniciando verificación de pago...");
  const [manualLoading, setManualLoading] = useState(false); // Estado para el botón manual
  const [webhookDetectado, setWebhookDetectado] = useState(false);
  const [ultimoEstado, setUltimoEstado] = useState<string>("pending");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const manejarPagoAprobado = useCallback(() => {
    setMensaje("¡Pago confirmado! Serás redirigido en unos segundos...");
    setVerificando(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    limpiarPedidoPendiente();
    localStorage.removeItem("mp_preference_id");

    setTimeout(() => {
      navigate("/payment/success");
    }, 3000);
  }, [navigate, limpiarPedidoPendiente]);

  // ✅ Función para la verificación manual mejorada
  const handleManualCheck = async () => {
    if (!preferenceId || manualLoading) return;

    setManualLoading(true);
    setMensaje("Realizando verificación manual...");
    console.log(`🔍 Verificación manual para preference_id: ${preferenceId}`);

    try {
      const resultado = await verificarEstadoPago(preferenceId);
      console.log("📥 Resultado verificación manual:", resultado);

      if (resultado.estado === "approved") {
        console.log("✅ ¡Pago aprobado manualmente!");
        manejarPagoAprobado();
      } else if (resultado.estado === "rejected") {
        setMensaje("❌ El pago fue rechazado.");
        setTimeout(() => {
          navigate("/payment/failure");
        }, 2000);
      } else {
        setMensaje(
          resultado.mensaje ||
            `El pago está en estado: ${resultado.estado}. Intenta de nuevo en unos momentos.`,
        );
      }
    } catch (error: any) {
      console.error("❌ Error durante la verificación manual:", error);

      if (
        error.message?.includes("404") ||
        error.message?.includes("no encontrado")
      ) {
        setMensaje(
          "❌ No se encontró información del pago. Contacta con soporte.",
        );
      } else if (
        error.message?.includes("401") ||
        error.message?.includes("autorizado")
      ) {
        setMensaje("❌ Sesión expirada. Por favor, inicia sesión nuevamente.");
      } else {
        setMensaje(
          "❌ Error al verificar. Revisa tu conexión o inténtalo más tarde.",
        );
      }
    } finally {
      setManualLoading(false);
    }
  };

  // ✅ Manejar estados transitorios mejor
  const verificarPagoAutomatico = useCallback(async () => {
    if (!preferenceId) {
      setVerificando(false);
      return;
    }

    setIntentos((prevIntentos) => {
      const intentoActual = prevIntentos + 1;
      if (intentoActual > maxIntentos) return prevIntentos;

      console.log(
        `🔍 Verificación automática (intento ${intentoActual}/${maxIntentos})`,
      );

      verificarEstadoPago(preferenceId)
        .then((resultado) => {
          console.log(`📥 Resultado verificación:`, resultado);

          // ✅ DETECTAR CAMBIOS DE ESTADO
          if (resultado.estado !== ultimoEstado) {
            console.log(
              `🔄 Cambio de estado detectado: ${ultimoEstado} → ${resultado.estado}`,
            );
            setUltimoEstado(resultado.estado);

            if (ultimoEstado === "pending" && resultado.estado === "approved") {
              setWebhookDetectado(true);
              setMensaje("🎉 ¡Pago confirmado! Procesando...");
            }
          }

          if (resultado.estado === "approved") {
            console.log("✅ ¡Pago aprobado!");
            manejarPagoAprobado();
          } else if (resultado.estado === "rejected") {
            console.log("❌ Pago rechazado");
            setVerificando(false);
            navigate("/payment/failure");
          } else {
            // ✅ MENSAJES MÁS CONTEXTUALES
            let mensajeContextual;

            if (webhookDetectado) {
              mensajeContextual = "🔄 Confirmando pago aprobado...";
            } else if (intentoActual <= 6) {
              mensajeContextual = `🔍 Verificando pago... (${intentoActual}/${maxIntentos})`;
            } else {
              const intervalo = obtenerIntervalo(intentoActual);
              mensajeContextual = `⏳ Esperando confirmación... Reintentando en ${intervalo / 1000}s`;
            }

            setMensaje(mensajeContextual);

            if (intentoActual >= maxIntentos) {
              setVerificando(false);
              setMensaje(
                "Verificación finalizada. Puedes verificar manualmente o revisar 'Mis Pedidos'.",
              );
            }
          }
        })
        .catch((error) => {
          console.error(
            `❌ Error en verificación (intento ${intentoActual}):`,
            error,
          );

          // ✅ MENSAJES DE ERROR MÁS AMIGABLES
          if (webhookDetectado) {
            setMensaje("🔄 Finalizando confirmación...");
          } else if (intentoActual < 3) {
            setMensaje("🔌 Conectando...");
          } else if (intentoActual >= maxIntentos) {
            setVerificando(false);
            setMensaje("⚠️ Verificación manual necesaria");
          } else {
            setMensaje("🔄 Reintentando conexión...");
          }
        });

      return intentoActual;
    });
  }, [
    preferenceId,
    maxIntentos,
    manejarPagoAprobado,
    navigate,
    webhookDetectado,
    ultimoEstado,
  ]);

  // ✅ INTERVALOS MÁS AGRESIVOS DESPUÉS DE DETECTAR ACTIVIDAD
  const obtenerIntervalo = (intento: number): number => {
    if (webhookDetectado && intento <= 10) {
      return 1000; // 1 segundo cuando detectamos que el webhook está activo
    }

    if (intento <= 6) return 3000; // Primeros 6: cada 3 segundos
    if (intento <= 12) return 5000; // Siguientes 6: cada 5 segundos
    return 10000; // Resto: cada 10 segundos
  };

  useEffect(() => {
    if (!preferenceId) {
      setVerificando(false);
      setMensaje("Error: No se encontró referencia de pago.");
      return;
    }

    // Primera verificación inmediata
    setTimeout(verificarPagoAutomatico, 1000);
  }, [preferenceId, verificarPagoAutomatico]);

  useEffect(() => {
    if (!verificando || intentos >= maxIntentos) {
      return;
    }

    const intervalo = obtenerIntervalo(intentos + 1);
    const timer = setTimeout(verificarPagoAutomatico, intervalo);

    return () => clearTimeout(timer);
  }, [intentos, maxIntentos, verificando, verificarPagoAutomatico]);

  useEffect(() => {
    if (intentos >= maxIntentos || !verificando) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [intentos, maxIntentos, verificando]);

  if (verificando) {
    return (
      <div className="payment-status-page pending">
        <Loading message={mensaje} />
        <div className="payment-details">
          <h2>
            {webhookDetectado ? "Confirmando pago" : "Verificando tu pago"}
          </h2>
          <p>
            {webhookDetectado
              ? "Tu pago fue procesado exitosamente. Finalizando confirmación..."
              : "Estamos confirmando tu pago automáticamente. Por favor, espera."}
          </p>

          {/* ✅ INDICADOR VISUAL DE PROGRESO */}
          {webhookDetectado && (
            <div className="success-indicator">
              <div className="spinner-success">✅</div>
              <p>Pago detectado - Confirmando...</p>
            </div>
          )}
        </div>

        <div className="progress-info">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(intentos / maxIntentos) * 100}%`,
                backgroundColor: webhookDetectado ? "#4caf50" : "#2196f3",
              }}
            ></div>
          </div>
        </div>

        <div className="payment-actions">
          <button
            className="btn-primary"
            onClick={handleManualCheck}
            disabled={manualLoading || webhookDetectado}
          >
            {manualLoading
              ? "Verificando..."
              : webhookDetectado
                ? "Procesando..."
                : "🔄 Verificar ahora"}
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate("/mis-pedidos")}
          >
            Ir a Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-status-page timeout">
      <div className="status-icon">⏰</div>
      <h1>Verificación Automática Finalizada</h1>
      <div className="payment-details">
        <p>No pudimos confirmar tu pago automáticamente.</p>
        <p>
          Si ya has pagado, haz clic en el botón de abajo para verificar
          manualmente.
        </p>
      </div>
      <div className="payment-actions">
        {/* ✅ Botón de verificación manual en la pantalla de timeout */}
        <button
          className="btn-primary"
          onClick={handleManualCheck}
          disabled={manualLoading}
        >
          {manualLoading ? "Verificando..." : "🔄 Verificar Pago Manualmente"}
        </button>
        <button
          className="btn-secondary"
          onClick={() => navigate("/mis-pedidos")}
        >
          Ver Mis Pedidos
        </button>
      </div>
      {/* Mensaje de estado para la verificación manual */}
      <p className="info-text">{mensaje}</p>
    </div>
  );
};

export default PaymentPendingPage;
