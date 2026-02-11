import { useState, useEffect, useCallback } from "react";
import { Instrumento } from "../types/types";
import {
  CarritoItem,
  CarritoState,
  PedidoRequest,
  PedidoResponse,
  DetallePedidoRequest,
  convertirCarritoADetalles,
  calcularTotalCarrito,
  validarItemCarrito,
} from "../types/pedido";
import { savePedido, verificarPedidoPendiente } from "../service/api";
import { authService } from "../service/authService";

const initialState: CarritoState = {
  items: [],
  mostrarCarrito: false,
  mensajePedido: null,
};

export const useCarrito = () => {
  const [carritoState, setCarritoState] = useState<CarritoState>(initialState);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pedidoPendiente, setPedidoPendiente] = useState<PedidoResponse | null>(
    null,
  );
  const [verificacionPendienteCompletada, setVerificacionPendienteCompletada] =
    useState<boolean>(false);

  // 🚫 VERIFICAR SI ES ADMIN - HELPER
  const verificarAccesoCliente = (): boolean => {
    if (authService.isAdmin()) {
      console.warn("❌ Funcionalidad de carrito bloqueada para ADMIN");
      alert(
        "⚠️ Los administradores no pueden usar el carrito de compras. Esta funcionalidad es exclusiva para clientes.",
      );
      return false;
    }
    return true;
  };

  // ✅ VERIFICAR PEDIDO PENDIENTE EN EL BACKEND - SIN DEPENDENCIAS CIRCULARES
  const verificarPedidoPendienteRemoto = useCallback(async () => {
    if (
      !authService.isAuthenticated() ||
      authService.isAdmin() ||
      verificacionPendienteCompletada
    ) {
      return;
    }

    try {
      console.log("🔍 Verificando pedido pendiente en el servidor...");
      const response = await verificarPedidoPendiente();

      if (response.tienePedidoPendiente && response.pedidoPendiente) {
        const pedido = response.pedidoPendiente;
        console.log("⚠️ Usuario tiene pedido pendiente:", pedido.id);

        setPedidoPendiente(pedido);

        // ✅ SOLO mostrar mensaje, NO limpiar carrito aquí para evitar bucles
        setCarritoState((prev) => ({
          ...prev,
          mensajePedido: `Tienes el pedido #${pedido.id} pendiente de pago ($${pedido.total}). Completa el pago antes de agregar nuevos productos.`,
        }));
      } else {
        console.log("✅ No hay pedidos pendientes");
        setPedidoPendiente(null);
      }

      setVerificacionPendienteCompletada(true);
    } catch (error) {
      console.error("Error verificando pedido pendiente:", error);
      setVerificacionPendienteCompletada(true);
    }
  }, [verificacionPendienteCompletada]); // ✅ SOLO depende de verificacionPendienteCompletada

  // ✅ CARGAR CARRITO AL MONTAR (SOLO UNA VEZ)
  useEffect(() => {
    // 🚫 BLOQUEO: Si es admin, no cargar carrito
    if (authService.isAdmin()) {
      console.log("🚫 Admin detectado - no cargando carrito");
      return;
    }

    try {
      const savedCart = localStorage.getItem("carrito");
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (parsedCart && Array.isArray(parsedCart.items)) {
          console.log(
            "📦 Carrito cargado desde localStorage:",
            parsedCart.items.length,
            "items",
          );
          setCarritoState((prevState) => ({
            ...prevState,
            items: parsedCart.items,
          }));
        }
      }
    } catch (err) {
      console.error("❌ Error al cargar el carrito desde localStorage:", err);
      localStorage.removeItem("carrito");
    }
  }, []); // ✅ SOLO se ejecuta al montar

  // ✅ VERIFICAR PEDIDO PENDIENTE AL MONTAR (SOLO UNA VEZ)
  useEffect(() => {
    verificarPedidoPendienteRemoto();
  }, []); // ✅ SOLO se ejecuta al montar

  // ✅ GUARDAR CARRITO EN LOCALSTORAGE CUANDO CAMBIE
  useEffect(() => {
    // 🚫 BLOQUEO: Si es admin, no guardar carrito
    if (authService.isAdmin()) {
      return;
    }

    // ✅ Si hay pedido pendiente, limpiar carrito en localStorage
    if (pedidoPendiente) {
      localStorage.removeItem("carrito");
      return;
    }

    try {
      const dataToSave = {
        items: carritoState.items,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("carrito", JSON.stringify(dataToSave));
      console.log(
        "💾 Carrito guardado en localStorage:",
        carritoState.items.length,
        "items",
      );
    } catch (err) {
      console.error("❌ Error al guardar el carrito en localStorage:", err);
    }
  }, [carritoState.items, pedidoPendiente]); // ✅ SOLO depende de items y pedidoPendiente

  // ✅ LIMPIAR CARRITO EN UI SI HAY PEDIDO PENDIENTE
  useEffect(() => {
    if (pedidoPendiente && carritoState.items.length > 0) {
      console.log("🧹 Limpiando carrito en UI debido a pedido pendiente");
      setCarritoState((prev) => ({
        ...prev,
        items: [],
      }));
    }
  }, [pedidoPendiente]); // ✅ SOLO se ejecuta cuando cambia pedidoPendiente

  // 🚫 Agregar instrumento al carrito - BLOQUEADO PARA ADMIN Y SI HAY PEDIDO PENDIENTE
  const agregarAlCarrito = useCallback(
    (instrumento: Instrumento, cantidad: number = 1) => {
      // 🚫 VERIFICAR ACCESO
      if (!verificarAccesoCliente()) return;

      // ✅ VERIFICAR PEDIDO PENDIENTE
      if (pedidoPendiente) {
        alert(
          `⚠️ Tienes el pedido #${pedidoPendiente.id} pendiente de pago ($${pedidoPendiente.total}). Completa el pago antes de agregar nuevos productos.`,
        );
        return;
      }

      // Validaciones existentes...
      if (!instrumento || !instrumento.idInstrumento) {
        console.error("❌ Instrumento inválido");
        return;
      }

      if (cantidad <= 0) {
        console.error("❌ Cantidad inválida");
        return;
      }

      if (instrumento.stock === 0) {
        alert(`❌ ${instrumento.denominacion} no tiene stock disponible`);
        return;
      }

      if (!instrumento.precioActual || instrumento.precioActual <= 0) {
        alert(`❌ ${instrumento.denominacion} no tiene precio válido`);
        return;
      }

      setCarritoState((prevState) => {
        const itemIndex = prevState.items.findIndex(
          (item) =>
            item.instrumento.idInstrumento === instrumento.idInstrumento,
        );

        let newItems: CarritoItem[];

        if (itemIndex >= 0) {
          const newCantidad = prevState.items[itemIndex].cantidad + cantidad;

          if (newCantidad > instrumento.stock) {
            alert(
              `⚠️ Solo hay ${instrumento.stock} unidades disponibles de ${instrumento.denominacion}`,
            );
            return prevState;
          }

          newItems = [...prevState.items];
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            cantidad: newCantidad,
          };

          console.log(
            `✅ Cantidad actualizada: ${instrumento.denominacion} x${newCantidad}`,
          );
        } else {
          if (cantidad > instrumento.stock) {
            alert(
              `⚠️ Solo hay ${instrumento.stock} unidades disponibles de ${instrumento.denominacion}`,
            );
            return prevState;
          }

          const nuevoItem: CarritoItem = { instrumento, cantidad };
          newItems = [...prevState.items, nuevoItem];
          console.log(
            `✅ Agregado al carrito: ${instrumento.denominacion} x${cantidad}`,
          );
        }

        return {
          ...prevState,
          items: newItems,
          mostrarCarrito: true,
        };
      });
    },
    [pedidoPendiente], // ✅ SOLO depende de pedidoPendiente
  );

  // 🚫 Actualizar cantidad - BLOQUEADO PARA ADMIN Y SI HAY PEDIDO PENDIENTE
  const actualizarCantidad = useCallback(
    (instrumentoIdStr: string, cantidad: number) => {
      // 🚫 VERIFICAR ACCESO
      if (!verificarAccesoCliente()) return;

      // ✅ VERIFICAR PEDIDO PENDIENTE
      if (pedidoPendiente) {
        alert(
          `⚠️ Completa el pago del pedido #${pedidoPendiente.id} antes de modificar el carrito.`,
        );
        return;
      }

      const instrumentoId = parseInt(instrumentoIdStr);

      if (isNaN(instrumentoId)) {
        console.error("❌ ID de instrumento inválido");
        return;
      }

      if (cantidad <= 0) {
        eliminarDelCarrito(instrumentoIdStr);
        return;
      }

      setCarritoState((prevState) => {
        const item = prevState.items.find(
          (item) => item.instrumento.idInstrumento === instrumentoId,
        );

        if (!item) {
          console.error("❌ Item no encontrado en el carrito");
          return prevState;
        }

        if (cantidad > item.instrumento.stock) {
          alert(`⚠️ Solo hay ${item.instrumento.stock} unidades disponibles`);
          return prevState;
        }

        const newItems = prevState.items.map((item) =>
          item.instrumento.idInstrumento === instrumentoId
            ? { ...item, cantidad }
            : item,
        );

        console.log(
          `📝 Cantidad actualizada: ${item.instrumento.denominacion} → ${cantidad}`,
        );

        return {
          ...prevState,
          items: newItems,
        };
      });
    },
    [pedidoPendiente], // ✅ SOLO depende de pedidoPendiente
  );

  // 🚫 Eliminar del carrito - BLOQUEADO PARA ADMIN Y SI HAY PEDIDO PENDIENTE
  const eliminarDelCarrito = useCallback(
    (instrumentoIdStr: string) => {
      // 🚫 VERIFICAR ACCESO
      if (!verificarAccesoCliente()) return;

      // ✅ VERIFICAR PEDIDO PENDIENTE
      if (pedidoPendiente) {
        alert(
          `⚠️ Completa el pago del pedido #${pedidoPendiente.id} antes de modificar el carrito.`,
        );
        return;
      }

      const instrumentoId = parseInt(instrumentoIdStr);

      if (isNaN(instrumentoId)) {
        console.error("❌ ID de instrumento inválido");
        return;
      }

      setCarritoState((prevState) => {
        const item = prevState.items.find(
          (item) => item.instrumento.idInstrumento === instrumentoId,
        );

        if (item) {
          console.log(
            `🗑️ Eliminado del carrito: ${item.instrumento.denominacion}`,
          );
        }

        return {
          ...prevState,
          items: prevState.items.filter(
            (item) => item.instrumento.idInstrumento !== instrumentoId,
          ),
        };
      });
    },
    [pedidoPendiente], // ✅ SOLO depende de pedidoPendiente
  );

  // 🚫 Vaciar carrito - BLOQUEADO PARA ADMIN Y SI HAY PEDIDO PENDIENTE
  const vaciarCarrito = useCallback(() => {
    // 🚫 VERIFICAR ACCESO
    if (!verificarAccesoCliente()) return;

    // ✅ VERIFICAR PEDIDO PENDIENTE
    if (pedidoPendiente) {
      alert(
        `⚠️ Completa el pago del pedido #${pedidoPendiente.id} antes de vaciar el carrito.`,
      );
      return;
    }

    console.log("🧹 Vaciando carrito...");
    setCarritoState((prevState) => ({
      ...prevState,
      items: [],
      mensajePedido: null,
    }));
  }, [pedidoPendiente]); // ✅ SOLO depende de pedidoPendiente

  // Toggle mostrar/ocultar carrito - PERMITIDO (pero con verificación)
  const toggleCarrito = useCallback(() => {
    // 🚫 Si es admin, mostrar mensaje y no abrir carrito
    if (authService.isAdmin()) {
      alert("⚠️ Los administradores no tienen acceso al carrito de compras.");
      return;
    }

    setCarritoState((prevState) => ({
      ...prevState,
      mostrarCarrito: !prevState.mostrarCarrito,
    }));
  }, []);

  // Crear pedido (preparar datos para el backend usando PedidoRequest)
  const crearPedido = useCallback((): PedidoRequest => {
    // 🚫 VERIFICAR ACCESO (aunque ya se verifica antes, doble seguridad)
    if (authService.isAdmin()) {
      throw new Error("Los administradores no pueden crear pedidos");
    }

    // ✅ VERIFICAR PEDIDO PENDIENTE
    if (pedidoPendiente) {
      throw new Error(
        `Ya tienes el pedido #${pedidoPendiente.id} pendiente de pago. Completa el pago antes de crear un nuevo pedido.`,
      );
    }

    const currentUser = authService.getUserFromStorage();

    if (!currentUser || !currentUser.id) {
      throw new Error("Usuario no autenticado. Por favor, inicia sesión.");
    }

    if (carritoState.items.length === 0) {
      throw new Error("El carrito está vacío");
    }

    // Validar todos los items antes de crear pedido
    const itemsInvalidos = carritoState.items.filter(
      (item) => !validarItemCarrito(item),
    );

    if (itemsInvalidos.length > 0) {
      const nombres = itemsInvalidos
        .map((item) => item.instrumento.denominacion)
        .join(", ");
      throw new Error(
        `Los siguientes productos tienen datos inválidos: ${nombres}`,
      );
    }

    // Validar stock antes de crear pedido
    const itemsSinStock = carritoState.items.filter(
      (item) => item.cantidad > item.instrumento.stock,
    );

    if (itemsSinStock.length > 0) {
      const nombres = itemsSinStock
        .map((item) => item.instrumento.denominacion)
        .join(", ");
      throw new Error(
        `Los siguientes productos no tienen stock suficiente: ${nombres}`,
      );
    }

    // ✅ Usar helper para convertir CarritoItem[] a DetallePedidoRequest[]
    const detalles: DetallePedidoRequest[] = convertirCarritoADetalles(
      carritoState.items,
    );

    // ✅ Crear PedidoRequest con la estructura correcta
    const pedidoRequest: PedidoRequest = {
      usuario: {
        idUsuario: currentUser.id,
      },
      detalles,
    };

    console.log("📦 Pedido preparado:", {
      usuarioId: currentUser.id,
      cantidadItems: detalles.length,
      total: calcularTotalCarrito(carritoState.items),
    });

    return pedidoRequest;
  }, [carritoState.items, pedidoPendiente]);

  // 🚫 Guardar pedido - BLOQUEADO PARA ADMIN Y SI HAY PEDIDO PENDIENTE
  const guardarPedido =
    useCallback(async (): Promise<PedidoResponse | null> => {
      // 🚫 VERIFICAR ACCESO
      if (!verificarAccesoCliente()) return null;

      // ✅ VERIFICAR PEDIDO PENDIENTE
      if (pedidoPendiente) {
        alert(
          `⚠️ Ya tienes el pedido #${pedidoPendiente.id} pendiente de pago ($${pedidoPendiente.total}). Completa el pago antes de crear un nuevo pedido.`,
        );
        return null;
      }

      if (carritoState.items.length === 0) {
        const errorMsg = "No hay items en el carrito";
        setError(errorMsg);
        alert(errorMsg);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const currentUser = authService.getUserFromStorage();

        if (!currentUser || !currentUser.id) {
          const errorMsg = "Debes iniciar sesión para crear un pedido";
          setError(errorMsg);
          alert(errorMsg);
          return null;
        }

        console.log("👤 Usuario autenticado:", {
          id: currentUser.id,
          email: currentUser.email,
          rol: currentUser.rol,
        });

        const pedidoRequest = crearPedido();
        console.log("📤 Enviando pedido al backend:", pedidoRequest);

        const pedidoGuardado: PedidoResponse = await savePedido(pedidoRequest);
        console.log("✅ Pedido guardado exitosamente:", pedidoGuardado);

        if (!pedidoGuardado || !pedidoGuardado.id) {
          throw new Error("No se recibió ID de pedido válido del servidor");
        }

        // ✅ LIMPIAR CARRITO INMEDIATAMENTE DESPUÉS DE CREAR PEDIDO
        console.log("🧹 Limpiando carrito después de crear pedido...");

        setCarritoState({
          items: [],
          mostrarCarrito: false,
          mensajePedido: `Pedido #${pedidoGuardado.id} creado correctamente ($${pedidoGuardado.total}). Procede al pago.`,
        });

        // Limpiar localStorage del carrito
        localStorage.removeItem("carrito");

        // Establecer como pedido pendiente
        setPedidoPendiente(pedidoGuardado);

        console.log(
          "🎉 Pedido creado y carrito limpiado. ID:",
          pedidoGuardado.id,
        );

        return pedidoGuardado;
      } catch (err) {
        console.error("❌ Error al guardar el pedido:", err);

        let errorMessage = "Error al guardar el pedido";

        if (err instanceof Error) {
          // Verificar si es el error de pedido pendiente
          if (
            err.message.includes("pedido") &&
            err.message.includes("pendiente")
          ) {
            errorMessage = err.message;
            // Refrescar estado del pedido pendiente sin bucle
            setVerificacionPendienteCompletada(false);
            verificarPedidoPendienteRemoto();
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        alert(`❌ ${errorMessage}`);
        return null;
      } finally {
        setLoading(false);
      }
    }, [
      carritoState.items,
      crearPedido,
      pedidoPendiente,
      verificarPedidoPendienteRemoto,
    ]);

  // ✅ NUEVO: Limpiar pedido pendiente (cuando se paga o cancela)
  const limpiarPedidoPendiente = useCallback(() => {
    console.log("🧹 Limpiando pedido pendiente...");
    setPedidoPendiente(null);
    setVerificacionPendienteCompletada(false); // ✅ Permitir verificar de nuevo
    // Limpiar mensaje también
    setCarritoState((prev) => ({
      ...prev,
      mensajePedido: null,
    }));
  }, []);

  // Limpiar mensaje de éxito/error
  const limpiarMensaje = useCallback(() => {
    console.log("🧹 Limpiando mensaje");
    setCarritoState((prevState) => ({
      ...prevState,
      mensajePedido: null,
    }));
    setError(null);
  }, []);

  const limpiarCarritoDespuesDePago = useCallback(() => {
    console.log("🎉 Limpiando carrito después del pago exitoso");

    setCarritoState({
      items: [],
      mostrarCarrito: false,
      mensajePedido: null,
    });

    setError(null);
    setPedidoPendiente(null);
    setVerificacionPendienteCompletada(false); // ✅ Reset verificación

    localStorage.removeItem("carrito");
    localStorage.removeItem("last_pedido_id");
    localStorage.removeItem("last_pedido_timestamp");

    console.log("✅ Carrito limpiado completamente");
  }, []);

  // Calcular totales
  const totalItems = carritoState.items.reduce(
    (sum, item) => sum + item.cantidad,
    0,
  );

  const totalPrecio = calcularTotalCarrito(carritoState.items);

  return {
    items: carritoState.items,
    mostrarCarrito: carritoState.mostrarCarrito,
    mensajePedido: carritoState.mensajePedido,
    loading,
    error,
    totalItems,
    totalPrecio,
    pedidoPendiente, // ✅ NUEVO
    agregarAlCarrito,
    actualizarCantidad,
    eliminarDelCarrito,
    vaciarCarrito,
    toggleCarrito,
    guardarPedido,
    limpiarMensaje,
    limpiarCarritoDespuesDePago,
    limpiarPedidoPendiente, // ✅ NUEVO
    verificarPedidoPendienteRemoto, // ✅ NUEVO
  };
};
