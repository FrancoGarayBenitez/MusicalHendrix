package com.example.instrumentos.controller;

import com.example.instrumentos.dto.request.PedidoRequestDTO;
import com.example.instrumentos.dto.response.PedidoResponseDTO;
import com.example.instrumentos.mapper.PedidoMapper;
import com.example.instrumentos.model.EstadoPedido;
import com.example.instrumentos.model.Pedido;
import com.example.instrumentos.model.Rol;
import com.example.instrumentos.model.Usuario;
import com.example.instrumentos.service.PedidoService;
import com.example.instrumentos.service.UsuarioService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/pedidos")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PedidoController {

    private final PedidoService pedidoService;
    private final PedidoMapper pedidoMapper;
    private final UsuarioService usuarioService;

    /**
     * Obtener todos los pedidos (solo admin)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PedidoResponseDTO>> getAllPedidos() {
        try {
            List<Pedido> pedidos = pedidoService.findAll();
            List<PedidoResponseDTO> response = pedidos.stream()
                    .map(pedidoMapper::toDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error al obtener todos los pedidos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtener pedidos de un usuario específico
     */
    @GetMapping("/usuario/{usuarioId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PedidoResponseDTO>> getPedidosByUsuario(@PathVariable Long usuarioId) {

        // Los admin pueden ver pedidos de cualquier usuario, los clientes solo los
        // suyos
        if (!esUsuarioAdmin()) {
            // Verificar que el usuario cliente solo acceda a sus propios pedidos
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            // Aquí necesitarías implementar la lógica para verificar que el usuarioId
            // coincida con el usuario autenticado
        }

        try {
            log.info("📦 Obteniendo pedidos del usuario: {}", usuarioId);
            List<Pedido> pedidos = pedidoService.findByUsuarioId(usuarioId);
            List<PedidoResponseDTO> response = pedidos.stream()
                    .map(pedidoMapper::toDTO)
                    .collect(Collectors.toList());
            log.info("✅ Se encontraron {} pedido(s)", response.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error al obtener pedidos del usuario {}", usuarioId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtener un pedido por su ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPedidoById(@PathVariable Long id) {
        try {
            log.info("📄 Consultando pedido ID: {}", id);
            return pedidoService.findById(id)
                    .map(pedido -> {
                        PedidoResponseDTO response = pedidoMapper.toDTO(pedido);
                        log.info("✅ Pedido {} encontrado", id);
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        log.warn("⚠️ Pedido {} no encontrado", id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("❌ Error al obtener pedido {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener el pedido"));
        }
    }

    /**
     * Crear un nuevo pedido - BLOQUEADO PARA ADMIN
     */
    @PostMapping
    @PreAuthorize("isAuthenticated() and !hasRole('ADMIN')")
    public ResponseEntity<?> createPedido(
            @Valid @RequestBody PedidoRequestDTO request,
            BindingResult bindingResult) {

        // Verificación adicional en el código (doble seguridad)
        if (esUsuarioAdmin()) {
            log.warn("❌ Intento de creación de pedido por usuario ADMIN bloqueado");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(crearRespuestaError("Los administradores no pueden crear pedidos"));
        }

        // Validar errores de binding
        if (bindingResult.hasErrors()) {
            String errores = bindingResult.getAllErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            log.error("❌ Errores de validación: {}", errores);
            return ResponseEntity.badRequest().body(crearRespuestaError(errores));
        }

        try {
            log.info("📥 Creando nuevo pedido");
            log.info("   Usuario ID: {}",
                    request.getUsuario() != null ? request.getUsuario().getIdUsuario() : "null");
            log.info("   Cantidad de detalles: {}",
                    request.getDetalles() != null ? request.getDetalles().size() : 0);

            // Convertir request DTO a entidad
            Pedido pedido = convertirRequestAPedido(request);

            // Guardar pedido
            Pedido pedidoGuardado = pedidoService.save(pedido);

            // Convertir a response DTO
            PedidoResponseDTO response = pedidoMapper.toDTO(pedidoGuardado);

            log.info("✅ Pedido creado exitosamente con ID: {}", response.getId());
            return new ResponseEntity<>(response, HttpStatus.CREATED);

        } catch (IllegalArgumentException e) {
            log.error("❌ Error de validación: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (IllegalStateException e) {
            log.error("❌ Error de estado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al crear pedido", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al crear el pedido"));
        }
    }

    /**
     * Confirmar pago de un pedido (llamado desde webhook)
     */
    @PostMapping("/{id}/confirmar-pago")
    public ResponseEntity<?> confirmarPago(@PathVariable Long id) {
        try {
            log.info("💳 Confirmando pago del pedido: {}", id);

            Pedido pedidoActualizado = pedidoService.confirmarPago(id);
            PedidoResponseDTO response = pedidoMapper.toDTO(pedidoActualizado);

            log.info("✅ Pago confirmado para pedido {}", id);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("❌ Error al confirmar pago: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al confirmar pago del pedido {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al confirmar el pago"));
        }
    }

    /**
     * Actualizar estado de un pedido (solo admin)
     */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateEstadoPedido(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String estadoStr = body.get("estado");
            if (estadoStr == null || estadoStr.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(crearRespuestaError("El estado es requerido"));
            }

            EstadoPedido nuevoEstado;
            try {
                nuevoEstado = EstadoPedido.valueOf(estadoStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(crearRespuestaError("Estado inválido: " + estadoStr));
            }

            log.info("🔄 Actualizando estado del pedido {} a {}", id, nuevoEstado);

            Pedido pedidoActualizado = pedidoService.actualizarEstado(id, nuevoEstado);
            PedidoResponseDTO response = pedidoMapper.toDTO(pedidoActualizado);

            log.info("✅ Estado actualizado correctamente");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("❌ Error al actualizar estado: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al actualizar estado del pedido {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al actualizar el estado"));
        }
    }

    /**
     * Cancelar un pedido - BLOQUEADO PARA ADMIN
     */
    @PostMapping("/{id}/cancelar")
    @PreAuthorize("isAuthenticated() and !hasRole('ADMIN')")
    public ResponseEntity<?> cancelarPedido(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {

        // Verificación adicional
        if (esUsuarioAdmin()) {
            log.warn("❌ Intento de cancelación de pedido por usuario ADMIN bloqueado");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(crearRespuestaError("Los administradores no pueden cancelar pedidos como clientes"));
        }

        try {
            String motivo = body != null ? body.get("motivo") : "Sin motivo especificado";
            log.info("❌ Cancelando pedido {} - Motivo: {}", id, motivo);

            Pedido pedidoCancelado = pedidoService.cancelarPedido(id, motivo);
            PedidoResponseDTO response = pedidoMapper.toDTO(pedidoCancelado);

            log.info("✅ Pedido {} cancelado exitosamente", id);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("❌ Error al cancelar pedido: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al cancelar pedido {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al cancelar el pedido"));
        }
    }

    /**
     * Eliminar un pedido (solo PENDIENTE_PAGO)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePedido(@PathVariable Long id) {
        try {
            log.info("🗑️ Eliminando pedido: {}", id);
            pedidoService.deletePedido(id);
            log.info("✅ Pedido {} eliminado correctamente", id);
            return ResponseEntity.noContent().build();

        } catch (IllegalArgumentException e) {
            log.error("❌ Error al eliminar pedido: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al eliminar pedido {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al eliminar el pedido"));
        }
    }

    /**
     * Obtener estadísticas de pedidos (solo admin)
     */
    @GetMapping("/estadisticas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> obtenerEstadisticas() {
        try {
            PedidoService.PedidoEstadisticas stats = pedidoService.obtenerEstadisticas();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("❌ Error al obtener estadísticas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener estadísticas"));
        }
    }

    /**
     * Verificar si el usuario tiene un pedido pendiente
     */
    @GetMapping("/pendiente")
    @PreAuthorize("isAuthenticated() and !hasRole('ADMIN')")
    public ResponseEntity<?> verificarPedidoPendiente() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();

            log.info("🔍 Verificando pedido pendiente para usuario: {}", email);

            // Buscar usuario por email
            Optional<Usuario> usuarioOpt = usuarioService.findByEmail(email);
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(crearRespuestaError("Usuario no encontrado"));
            }

            Usuario usuario = usuarioOpt.get();

            // Verificar si tiene pedido pendiente
            Optional<Pedido> pedidoPendienteOpt = pedidoService.obtenerPedidoPendienteCompleto(usuario.getIdUsuario());

            Map<String, Object> response = new HashMap<>();

            if (pedidoPendienteOpt.isPresent()) {
                Pedido pedidoPendiente = pedidoPendienteOpt.get();
                PedidoResponseDTO pedidoDTO = pedidoMapper.toDTO(pedidoPendiente);

                response.put("tienePedidoPendiente", true);
                response.put("pedidoPendiente", pedidoDTO);

                log.info("⚠️ Usuario {} tiene pedido pendiente: #{}",
                        email, pedidoPendiente.getIdPedido());
            } else {
                response.put("tienePedidoPendiente", false);
                response.put("pedidoPendiente", null);

                log.info("✅ Usuario {} no tiene pedidos pendientes", email);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error al verificar pedido pendiente", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al verificar pedido pendiente"));
        }
    }

    /**
     * Convertir PedidoRequestDTO a entidad Pedido
     */
    private Pedido convertirRequestAPedido(PedidoRequestDTO request) {
        // Usar el mapper para convertir los detalles
        List<com.example.instrumentos.model.DetallePedido> detalles = pedidoMapper
                .toDetallePedidoEntities(request.getDetalles());

        // Crear el pedido
        Pedido pedido = new Pedido();

        // Asignar usuario
        com.example.instrumentos.model.Usuario usuario = new com.example.instrumentos.model.Usuario();
        usuario.setIdUsuario(request.getUsuario().getIdUsuario());
        pedido.setUsuario(usuario);

        // Asignar detalles
        pedido.setDetalles(detalles);

        return pedido;
    }

    /**
     * Método auxiliar para crear respuestas de error consistentes
     */
    private Map<String, String> crearRespuestaError(String mensaje) {
        Map<String, String> error = new HashMap<>();
        error.put("error", mensaje);
        return error;
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
}