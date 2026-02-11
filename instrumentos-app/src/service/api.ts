import { Instrumento, Categoria } from "../types/types";
import { PedidoRequest, PedidoResponse, EstadoPedido } from "../types/pedido";
import { MercadoPagoResponse, PagoStatusResponse } from "../types/payment";
import { authService } from "./authService";

const API_URL = "http://localhost:8080/api";

/**
 * Headers básicos sin autenticación (endpoints públicos)
 */
const getBasicHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
});

// ===== INSTRUMENTOS API =====

/**
 * Obtener todos los instrumentos (público)
 */
export const fetchInstrumentos = async (): Promise<Instrumento[]> => {
  try {
    const response = await fetch(`${API_URL}/instrumentos`, {
      headers: getBasicHeaders(),
    });
    if (!response.ok) throw new Error("Error al obtener instrumentos");
    return response.json();
  } catch (error) {
    console.error("Error fetching instrumentos:", error);
    throw error;
  }
};

/**
 * Obtener instrumentos por categoría (público)
 */
export const fetchInstrumentosByCategoria = async (
  idCategoria: number,
): Promise<Instrumento[]> => {
  try {
    const response = await fetch(
      `${API_URL}/instrumentos?idCategoria=${idCategoria}`,
      {
        headers: getBasicHeaders(),
      },
    );
    if (!response.ok)
      throw new Error("Error al obtener instrumentos por categoría");
    return response.json();
  } catch (error) {
    console.error("Error fetching instrumentos by categoria:", error);
    throw error;
  }
};

/**
 * Obtener un instrumento por ID (público)
 */
export const fetchInstrumentoById = async (
  id: string,
): Promise<Instrumento> => {
  try {
    const response = await fetch(`${API_URL}/instrumentos/${id}`, {
      headers: getBasicHeaders(),
    });
    if (!response.ok) throw new Error("Instrumento no encontrado");
    return response.json();
  } catch (error) {
    console.error("Error fetching instrumento by id:", error);
    throw error;
  }
};

/**
 * Crear un nuevo instrumento (solo ADMIN)
 */
export const createInstrumento = async (
  instrumento: Omit<Instrumento, "idInstrumento">,
): Promise<Instrumento> => {
  try {
    const response = await fetch(`${API_URL}/instrumentos`, {
      method: "POST",
      headers: authService.getAuthHeaders(), // ✅ JWT
      body: JSON.stringify({
        denominacion: instrumento.denominacion,
        marca: instrumento.marca,
        stock: instrumento.stock,
        descripcion: instrumento.descripcion,
        imagen: instrumento.imagen,
        categoriaId: instrumento.categoriaInstrumento.idCategoriaInstrumento,
        precioActual: instrumento.precioActual,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al crear instrumento");
    }

    return response.json();
  } catch (error) {
    console.error("Error creating instrumento:", error);
    throw error;
  }
};

/**
 * Actualizar un instrumento (solo ADMIN)
 */
export const updateInstrumento = async (
  id: string | number,
  instrumento: Omit<Instrumento, "idInstrumento">,
): Promise<Instrumento> => {
  try {
    const categoriaId =
      instrumento.categoriaInstrumento?.idCategoriaInstrumento;
    if (!categoriaId) {
      throw new Error("La categoría del instrumento es requerida");
    }

    const response = await fetch(`${API_URL}/instrumentos/${id}`, {
      method: "PUT",
      headers: authService.getAuthHeaders(), // ✅ JWT
      body: JSON.stringify({
        denominacion: instrumento.denominacion,
        marca: instrumento.marca,
        stock: instrumento.stock,
        descripcion: instrumento.descripcion,
        imagen: instrumento.imagen,
        categoriaId: categoriaId,
        precioActual: instrumento.precioActual,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al actualizar instrumento");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating instrumento:", error);
    throw error;
  }
};

/**
 * Eliminar un instrumento (solo ADMIN)
 */
export const deleteInstrumento = async (id: string | number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/instrumentos/${id}`, {
      method: "DELETE",
      headers: authService.getAuthHeaders(), // ✅ JWT
    });

    if (!response.ok) throw new Error("Error al eliminar instrumento");
  } catch (error) {
    console.error("Error deleting instrumento:", error);
    throw error;
  }
};

/**
 * Actualizar precio de un instrumento (solo ADMIN)
 */
export const updateInstrumentPrice = async (
  id: string | number,
  precio: number,
): Promise<Instrumento> => {
  try {
    const response = await fetch(`${API_URL}/instrumentos/${id}/precio`, {
      method: "PATCH",
      headers: authService.getAuthHeaders(), // ✅ JWT
      body: JSON.stringify({ precio }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al actualizar precio");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating price:", error);
    throw error;
  }
};

/**
 * Actualizar stock de un instrumento (solo ADMIN)
 */
export const updateInstrumentStock = async (
  id: string | number,
  cantidad: number,
): Promise<Instrumento> => {
  try {
    const response = await fetch(`${API_URL}/instrumentos/${id}/stock`, {
      method: "PATCH",
      headers: authService.getAuthHeaders(), // ✅ JWT
      body: JSON.stringify({ cantidad }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al actualizar stock");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating stock:", error);
    throw error;
  }
};

/**
 * Obtener instrumentos con bajo stock (solo ADMIN)
 */
export const fetchInstrumentosBajoStock = async (): Promise<Instrumento[]> => {
  try {
    const response = await fetch(`${API_URL}/instrumentos/bajo-stock`, {
      headers: authService.getAuthHeaders(), // ✅ JWT
    });

    if (!response.ok)
      throw new Error("Error al obtener instrumentos con bajo stock");
    return response.json();
  } catch (error) {
    console.error("Error fetching bajo stock:", error);
    throw error;
  }
};

/**
 * Subir imagen de instrumento
 */
export const uploadImagen = async (
  file: File,
): Promise<{ fileName: string; url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    body: formData,
    // No incluir Content-Type, el browser lo agrega automáticamente con boundary
  });

  if (!response.ok) throw new Error("Error al subir la imagen");
  return response.json();
};

// ===== CATEGORIAS API =====

/**
 * Obtener todas las categorías (público)
 */
export const fetchCategorias = async (): Promise<Categoria[]> => {
  try {
    const response = await fetch(`${API_URL}/categorias`, {
      headers: getBasicHeaders(),
    });
    if (!response.ok) throw new Error("Error al obtener categorías");
    return response.json();
  } catch (error) {
    console.error("Error fetching categorias:", error);
    throw error;
  }
};

/**
 * Obtener categoría por ID (público)
 */
export const fetchCategoriaById = async (id: number): Promise<Categoria> => {
  try {
    const response = await fetch(`${API_URL}/categorias/${id}`, {
      headers: getBasicHeaders(),
    });
    if (!response.ok) throw new Error("Categoría no encontrada");
    return response.json();
  } catch (error) {
    console.error("Error fetching categoria by id:", error);
    throw error;
  }
};

// ===== PEDIDOS API =====

/**
 * Crear un nuevo pedido (requiere autenticación)
 */
export const savePedido = async (
  pedidoRequest: PedidoRequest,
): Promise<PedidoResponse> => {
  try {
    console.log("📤 Enviando pedido al backend:", pedidoRequest);

    const response = await fetch(`${API_URL}/pedidos`, {
      method: "POST",
      headers: authService.getAuthHeaders(), // ✅ JWT
      body: JSON.stringify(pedidoRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al guardar pedido");
    }

    const pedidoGuardado: PedidoResponse = await response.json();
    console.log("✅ Pedido guardado:", pedidoGuardado);
    return pedidoGuardado;
  } catch (error) {
    console.error("❌ Error saving pedido:", error);
    throw error;
  }
};

/**
 * ✅ NUEVO: Verificar si el usuario tiene un pedido pendiente de pago
 */
export const verificarPedidoPendiente = async (): Promise<{
  tienePedidoPendiente: boolean;
  pedidoPendiente?: PedidoResponse;
}> => {
  // 🚫 VERIFICAR QUE NO SEA ADMIN
  if (authService.isAdmin()) {
    return { tienePedidoPendiente: false };
  }

  try {
    const response = await fetch(`${API_URL}/pedidos/pendiente`, {
      headers: authService.getAuthHeaders(),
    });

    if (!response.ok) {
      return { tienePedidoPendiente: false };
    }

    return await response.json();
  } catch (error) {
    console.error("Error verificando pedido pendiente:", error);
    return { tienePedidoPendiente: false };
  }
};

/**
 * Obtener todos los pedidos (solo ADMIN)
 */
export const fetchPedidos = async (): Promise<PedidoResponse[]> => {
  try {
    const response = await fetch(`${API_URL}/pedidos`, {
      headers: authService.getAuthHeaders(), // ✅ JWT
    });

    if (!response.ok) throw new Error("Error al obtener pedidos");
    return response.json();
  } catch (error) {
    console.error("Error fetching pedidos:", error);
    throw error;
  }
};

/**
 * Obtener pedidos de un usuario específico
 */
export const fetchPedidosByUsuario = async (
  usuarioId: number,
): Promise<PedidoResponse[]> => {
  try {
    const response = await fetch(`${API_URL}/pedidos/usuario/${usuarioId}`, {
      headers: authService.getAuthHeaders(), // ✅ JWT
    });

    if (!response.ok) throw new Error("Error al obtener pedidos del usuario");
    return response.json();
  } catch (error) {
    console.error("Error fetching pedidos by usuario:", error);
    throw error;
  }
};

/**
 * Obtener un pedido por ID
 */
export const fetchPedidoById = async (
  pedidoId: number,
): Promise<PedidoResponse> => {
  try {
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
      headers: authService.getAuthHeaders(), // ✅ JWT
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Pedido no encontrado");
      }
      throw new Error("Error al obtener pedido");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching pedido:", error);
    throw error;
  }
};

/**
 * Actualizar estado de un pedido (solo ADMIN)
 */
export const updatePedidoEstado = async (
  pedidoId: number,
  nuevoEstado: EstadoPedido | string,
): Promise<PedidoResponse> => {
  try {
    console.log(
      `📝 Actualizando estado del pedido ${pedidoId} a ${nuevoEstado}`,
    );

    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/estado`, {
      method: "PATCH",
      headers: authService.getAuthHeaders(), // ✅ JWT
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al actualizar estado");
    }

    const pedidoActualizado: PedidoResponse = await response.json();
    console.log("✅ Estado actualizado:", pedidoActualizado);
    return pedidoActualizado;
  } catch (error) {
    console.error("❌ Error updating pedido estado:", error);
    throw error;
  }
};

/**
 * Eliminar un pedido (solo ADMIN, solo si está PENDIENTE_PAGO)
 */
export const deletePedido = async (pedidoId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
      method: "DELETE",
      headers: authService.getAuthHeaders(), // ✅ JWT
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al eliminar pedido");
    }
  } catch (error) {
    console.error("Error deleting pedido:", error);
    throw error;
  }
};

/**
 * Obtener estadísticas de pedidos (solo ADMIN)
 */
export const fetchEstadisticasPedidos = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/pedidos/estadisticas`, {
      headers: authService.getAuthHeaders(), // ✅ JWT
    });

    if (!response.ok) throw new Error("Error al obtener estadísticas");
    return response.json();
  } catch (error) {
    console.error("Error fetching estadisticas:", error);
    throw error;
  }
};

// ===== PAGOS API =====

/**
 * Crear preferencia de pago en MercadoPago.
 */
export const createPayment = async (
  pedidoId: string | number,
): Promise<MercadoPagoResponse> => {
  if (authService.isAdmin()) {
    throw new Error(
      "Los administradores no pueden crear pagos. Esta funcionalidad es exclusiva para clientes.",
    );
  }

  try {
    console.log(`💳 Creando preferencia de pago para pedido: ${pedidoId}`);
    const response = await fetch(`${API_URL}/pagos/crear/${pedidoId}`, {
      method: "POST",
      headers: authService.getAuthHeaders(),
    });

    if (!response.ok) {
      let errorMessage = "Error al crear la preferencia de pago";

      try {
        const errorData = await response.json();
        console.error("🔍 Error details:", errorData);

        // ✅ MANEJO ESPECÍFICO DE ERRORES
        if (errorData.codigo === "MERCADOPAGO_ERROR") {
          errorMessage = "Error de MercadoPago. Verifica tu configuración.";
          console.error("💳 MercadoPago Error Details:", errorData.detalle);
        } else if (errorData.codigo === "VALIDATION_ERROR") {
          errorMessage = errorData.error || "Error de validación";
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.error("No se pudo parsear la respuesta de error");
        errorMessage = `Error del servidor (${response.status})`;
      }

      throw new Error(errorMessage);
    }

    const data: MercadoPagoResponse = await response.json();
    console.log("✅ Preferencia creada:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al crear la preferencia de pago:", error);
    throw error;
  }
};

/**
 * Verificar estado con timeout optimizado
 */
export const verificarEstadoPago = async (
  preferenceId: string,
): Promise<PagoStatusResponse> => {
  try {
    console.log(`🔍 Verificando estado (optimizado) para: ${preferenceId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // ✅ 8 segundos máximo

    const response = await fetch(
      `${API_URL}/pagos/verificar-estado/${preferenceId}`,
      {
        method: "GET",
        headers: authService.getAuthHeaders(),
        signal: controller.signal, // ✅ Cancelar si toma mucho tiempo
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const result: PagoStatusResponse = await response.json();
    console.log(`📥 Respuesta rápida:`, result);

    return result;
  } catch (error) {
    console.error("❌ Error en verificación rápida:", error);
    throw error;
  }
};
