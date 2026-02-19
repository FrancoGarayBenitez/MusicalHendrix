package com.example.instrumentos.controller;

import com.example.instrumentos.dto.response.MercadoPagoResponseDTO;
import com.example.instrumentos.dto.response.PagoResponseDTO;
import com.example.instrumentos.dto.response.PagoStatusResponseDTO;
import com.example.instrumentos.mapper.PagoMapper;
import com.example.instrumentos.model.Pago;
import com.example.instrumentos.service.PagoService;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/pagos")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PagoController {

    private final PagoService pagoService;
    private final PagoMapper pagoMapper;

    /**
     * Crear preferencia de pago en MercadoPago para un pedido - BLOQUEADO PARA
     * ADMIN
     */
    @PostMapping("/crear/{pedidoId}")
    @PreAuthorize("isAuthenticated() and !hasRole('ADMIN')")
    public ResponseEntity<?> crearPago(@PathVariable Long pedidoId) {
        try {
            log.info("🚀 Iniciando creación de pago para pedido: {}", pedidoId);

            Map<String, String> resultado = pagoService.crearPago(pedidoId);

            // ✅ CONVERTIR A DTO TIPADO
            MercadoPagoResponseDTO response = MercadoPagoResponseDTO.builder()
                    .preferenceId(resultado.get("preference_id"))
                    .initPoint(resultado.get("init_point"))
                    .sandboxInitPoint(resultado.get("init_point")) // En sandbox, ambos son iguales
                    .build();

            log.info("✅ Pago creado exitosamente - Preference ID: {}", response.getPreferenceId());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Error de validación al crear pago: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("codigo", "VALIDATION_ERROR");
            return ResponseEntity.badRequest().body(errorResponse);

        } catch (RuntimeException e) {
            log.error("❌ Error de runtime al crear pago: {}", e.getMessage(), e);

            String mensaje = e.getMessage();
            if (mensaje != null && mensaje.contains("MercadoPago")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Error al procesar el pago con MercadoPago. Por favor, intente nuevamente.");
                errorResponse.put("detalle", mensaje);
                errorResponse.put("codigo", "MERCADOPAGO_ERROR");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
            }

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno del servidor. Por favor, contacte con soporte.");
            errorResponse.put("codigo", "INTERNAL_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);

        } catch (Exception e) {
            log.error("❌ Error inesperado al crear pago: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error inesperado. Por favor, intente nuevamente más tarde.");
            errorResponse.put("codigo", "UNEXPECTED_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Obtener todos los pagos de un pedido específico - ADMIN puede ver todos
     */
    @GetMapping("/pedido/{pedidoId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> obtenerPagosPorPedido(@PathVariable Long pedidoId) {
        try {
            log.info("📄 Consultando pagos del pedido: {}", pedidoId);

            List<Pago> pagos = pagoService.obtenerPagosPorPedido(pedidoId);
            List<PagoResponseDTO> response = pagoMapper.toDTOList(pagos);

            log.info("✅ Se encontraron {} pago(s) para el pedido {}", response.size(), pedidoId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error al obtener pagos del pedido {}: {}", pedidoId, e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener los pagos del pedido"));
        }
    }

    /**
     * Obtener un pago específico por su ID - ADMIN puede ver todos
     */
    @GetMapping("/{pagoId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> obtenerPago(@PathVariable Long pagoId) {
        try {
            log.info("📄 Consultando pago ID: {}", pagoId);

            return pagoService.obtenerPago(pagoId)
                    .map(pago -> {
                        PagoResponseDTO response = pagoMapper.toDTO(pago);
                        log.info("✅ Pago {} encontrado", pagoId);
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        log.warn("⚠️ Pago {} no encontrado", pagoId);
                        return ResponseEntity.notFound().build();
                    });

        } catch (Exception e) {
            log.error("❌ Error al obtener pago {}: {}", pagoId, e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener el pago"));
        }
    }

    /**
     * Webhook optimizado para respuesta rápida
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> webhookMercadoPago(
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "id", required = false) String notificationId,
            @RequestParam(value = "type", required = false) String type,
            @RequestHeader(value = "user-agent", required = false) String userAgent,
            HttpServletRequest request) {

        try {
            log.info("🔔 Webhook recibido - Topic: {}, ID: {}", topic, notificationId);

            // ✅ RESPUESTA INMEDIATA A MERCADOPAGO
            if ("payment".equals(topic) && notificationId != null && !notificationId.trim().isEmpty()) {
                // ✅ PROCESAMIENTO ASÍNCRONO
                CompletableFuture.runAsync(() -> {
                    try {
                        log.info("🔄 Procesando webhook async para payment ID: {}", notificationId);
                        pagoService.procesarNotificacionPago(notificationId);
                        log.info("✅ Webhook procesado async exitosamente");
                    } catch (Exception e) {
                        log.error("❌ Error en procesamiento async del webhook: {}", e.getMessage(), e);
                    }
                });

            } else {
                log.warn("❓ Webhook ignorado - Topic: {}, ID: {}", topic, notificationId);
            }

            // ✅ RESPUESTA INMEDIATA (< 1 segundo)
            return ResponseEntity.ok("OK");

        } catch (Exception e) {
            log.error("❌ Error en webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok("ERROR_HANDLED");
        }
    }

    /**
     * Endpoint para verificar que el webhook esté accesible públicamente
     */
    @GetMapping("/webhook/test")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, String>> testWebhook(HttpServletRequest request) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Webhook endpoint está accesible");
        response.put("url", request.getRequestURL().toString());
        response.put("timestamp", new Date().toString());

        log.info("🧪 Test de webhook realizado desde IP: {}", getClientIpAddress(request));

        return ResponseEntity.ok(response);
    }

    /**
     * Verificar si un pedido tiene pago aprobado - BLOQUEADO PARA ADMIN
     */
    @GetMapping("/pedido/{pedidoId}/tiene-pago-aprobado")
    @PreAuthorize("isAuthenticated() and !hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> verificarPagoAprobado(@PathVariable Long pedidoId) {

        if (esUsuarioAdmin()) {
            log.warn("❌ Admin intentando verificar pago aprobado - funcionalidad de cliente");
            Map<String, Boolean> response = new HashMap<>();
            response.put("error", true);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            boolean tienePago = pagoService.tienePagoAprobado(pedidoId);

            Map<String, Boolean> response = new HashMap<>();
            response.put("tienePagoAprobado", tienePago);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error al verificar pago del pedido {}: {}", pedidoId, e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("tienePagoAprobado", false));
        }
    }

    /**
     * Obtener el último pago de un pedido - ADMIN puede ver todos
     */
    @GetMapping("/pedido/{pedidoId}/ultimo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> obtenerUltimoPago(@PathVariable Long pedidoId) {
        try {
            return pagoService.obtenerUltimoPagoPorPedido(pedidoId)
                    .map(pago -> {
                        PagoResponseDTO response = pagoMapper.toDTO(pago);
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        log.info("ℹ️ No se encontraron pagos para el pedido {}", pedidoId);
                        return ResponseEntity.notFound().build();
                    });

        } catch (Exception e) {
            log.error("❌ Error al obtener último pago del pedido {}: {}",
                    pedidoId, e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener el último pago"));
        }
    }

    /**
     * Método auxiliar para verificar si el usuario actual es admin
     */
    private boolean esUsuarioAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            return auth.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        }
        return false;
    }

    private Map<String, Object> crearRespuestaError(String mensaje) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", mensaje);
        return error;
    }

    /**
     * Obtener IP real del cliente (para logging del webhook)
     */
    private String getClientIpAddress(jakarta.servlet.http.HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * Verificar el estado de un pago usando la preference_id.
     * Endpoint principal para que el frontend consulte el estado del pago.
     */
    @GetMapping("/verificar-estado/{preferenceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PagoStatusResponseDTO> verificarEstadoPago(@PathVariable String preferenceId) {
        try {
            log.info("🔍 Solicitud de verificación de estado para preference_id: {}", preferenceId);

            if (preferenceId == null || preferenceId.trim().isEmpty()) {
                log.warn("⚠️ Preference ID vacío o nulo");
                PagoStatusResponseDTO errorResponse = PagoStatusResponseDTO.builder()
                        .preferenceId(preferenceId)
                        .estado("error")
                        .mensaje("ID de preferencia requerido")
                        .timestamp(new Date())
                        .build();
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // ✅ Llamar al servicio para verificar y actualizar
            String estadoActualizado = pagoService.verificarYActualizarPago(preferenceId);

            // ✅ Crear respuesta tipada
            String mensaje = obtenerMensajePorEstado(estadoActualizado);
            PagoStatusResponseDTO response = PagoStatusResponseDTO.builder()
                    .preferenceId(preferenceId)
                    .estado(estadoActualizado)
                    .mensaje(mensaje)
                    .timestamp(new Date())
                    .build();

            log.info("✅ Verificación completada - Estado: {}", estadoActualizado);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Pago no encontrado para preference_id: {}", preferenceId);
            PagoStatusResponseDTO errorResponse = PagoStatusResponseDTO.builder()
                    .preferenceId(preferenceId)
                    .estado("not_found")
                    .mensaje("Pago no encontrado")
                    .timestamp(new Date())
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);

        } catch (Exception e) {
            log.error("❌ Error en la verificación de estado del pago: {}", e.getMessage(), e);
            PagoStatusResponseDTO errorResponse = PagoStatusResponseDTO.builder()
                    .preferenceId(preferenceId)
                    .estado("error")
                    .mensaje("Error interno del servidor")
                    .timestamp(new Date())
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Obtener mensaje contextual según el estado
     */
    private String obtenerMensajePorEstado(String estado) {
        switch (estado) {
            case "approved":
                return "Pago confirmado exitosamente";
            case "pending":
                return "Pago en proceso de verificación";
            case "rejected":
                return "Pago rechazado";
            case "in_process":
                return "Pago en proceso";
            case "cancelled":
                return "Pago cancelado";
            default:
                return "Estado: " + estado;
        }
    }

    @GetMapping("/payment/redirect")
    @PreAuthorize("permitAll()") // 👈 Crucial para que no pida login al redirigir
    public ResponseEntity<Void> redirectAfterPayment(HttpServletRequest request) {
        String queryParams = request.getQueryString();
        String frontendUrl = "http://localhost:5173/payment/pending?" + queryParams;

        log.info("Redirecting to frontend: {}", frontendUrl);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendUrl))
                .build();
    }
}