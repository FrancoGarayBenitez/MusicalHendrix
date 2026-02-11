package com.example.instrumentos.service;

import com.example.instrumentos.model.*;
import com.example.instrumentos.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PedidoService {

        private final PedidoRepository pedidoRepository;
        private final UsuarioRepository usuarioRepository;
        private final InstrumentoRepository instrumentoRepository;
        private final InstrumentoService instrumentoService;

        /**
         * Obtener todos los pedidos
         */
        public List<Pedido> findAll() {
                return pedidoRepository.findAll();
        }

        /**
         * Buscar pedido por ID con todos sus detalles
         */
        public Optional<Pedido> findById(Long id) {
                return pedidoRepository.findByIdWithDetalles(id);
        }

        /**
         * Obtener pedidos de un usuario específico
         */
        public List<Pedido> findByUsuarioId(Long usuarioId) {
                return pedidoRepository.findByUsuario_IdUsuario(usuarioId);
        }

        /**
         * Crear un nuevo pedido
         */
        public Pedido save(Pedido pedido) {
                log.info("📦 Iniciando creación de nuevo pedido");

                // 1. Validar usuario
                if (pedido.getUsuario() == null || pedido.getUsuario().getIdUsuario() == null) {
                        throw new IllegalArgumentException("El pedido debe tener un usuario asignado");
                }

                Usuario usuario = usuarioRepository.findById(pedido.getUsuario().getIdUsuario())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Usuario no encontrado con ID: " + pedido.getUsuario().getIdUsuario()));

                pedido.setUsuario(usuario);
                log.info("👤 Usuario: {}", usuario.getEmail());

                // ✅ NUEVA VALIDACIÓN: Verificar que no tenga pedido pendiente
                boolean tienePedidoPendiente = pedidoRepository.existsByUsuarioAndEstado(
                                usuario.getIdUsuario(),
                                EstadoPedido.PENDIENTE_PAGO);

                if (tienePedidoPendiente) {
                        // Obtener el pedido pendiente para mostrar el ID
                        Optional<Pedido> pedidoPendienteOpt = pedidoRepository.findByUsuarioAndEstado(
                                        usuario,
                                        EstadoPedido.PENDIENTE_PAGO);

                        String mensajeError = "Ya tienes un pedido pendiente de pago. " +
                                        "Debes completar el pago o cancelar el pedido existente antes de crear uno nuevo.";

                        if (pedidoPendienteOpt.isPresent()) {
                                Long pedidoId = pedidoPendienteOpt.get().getIdPedido();
                                mensajeError = "Ya tienes el pedido #" + pedidoId + " pendiente de pago. " +
                                                "Debes completar el pago o cancelar este pedido antes de crear uno nuevo.";
                        }

                        log.warn("❌ Usuario {} ya tiene un pedido pendiente de pago", usuario.getIdUsuario());
                        throw new IllegalArgumentException(mensajeError);
                }

                // 2. Establecer fecha y estado inicial
                if (pedido.getFecha() == null) {
                        pedido.setFecha(new Date());
                }
                pedido.setEstado(EstadoPedido.PENDIENTE_PAGO);
                pedido.setFechaActualizacionEstado(new Date());

                // 3. Validar que tenga detalles
                if (pedido.getDetalles() == null || pedido.getDetalles().isEmpty()) {
                        throw new IllegalArgumentException("El pedido debe tener al menos un producto");
                }

                log.info("📝 Procesando {} detalles", pedido.getDetalles().size());

                // 4. Procesar detalles y validar stock (NO descontar, solo validar)
                List<DetallePedido> detallesValidados = new ArrayList<>();
                double totalCalculado = 0.0;

                for (DetallePedido detalle : pedido.getDetalles()) {
                        // Obtener ID del instrumento
                        Long instrumentoId = detalle.getInstrumento() != null
                                        ? detalle.getInstrumento().getIdInstrumento()
                                        : detalle.getInstrumentoId();

                        if (instrumentoId == null) {
                                throw new IllegalArgumentException("El detalle debe tener un instrumento asociado");
                        }

                        // Obtener instrumento completo
                        Instrumento instrumento = instrumentoRepository.findById(instrumentoId)
                                        .orElseThrow(() -> new IllegalArgumentException(
                                                        "Instrumento no encontrado con ID: " + instrumentoId));

                        log.info("🎸 Instrumento: {} - Stock disponible: {}",
                                        instrumento.getDenominacion(), instrumento.getStock());

                        // Validar stock disponible (NO descontar aún, solo validar)
                        if (!instrumento.tieneStockDisponible(detalle.getCantidad())) {
                                throw new IllegalArgumentException(
                                                "Stock insuficiente para " + instrumento.getDenominacion() +
                                                                ". Disponible: " + instrumento.getStock() +
                                                                ", Solicitado: " + detalle.getCantidad());
                        }

                        // Obtener precio actual del historial
                        Double precioActual = instrumentoService.obtenerPrecioActual(instrumento);

                        // Configurar detalle con precio actual del instrumento
                        detalle.setPedido(pedido);
                        detalle.setInstrumento(instrumento);
                        detalle.setPrecioUnitario(precioActual);

                        detallesValidados.add(detalle);

                        // Calcular subtotal
                        double subtotal = precioActual * detalle.getCantidad();
                        totalCalculado += subtotal;

                        log.info("   Cantidad: {} x ${} = ${}",
                                        detalle.getCantidad(), precioActual, subtotal);
                }

                pedido.setDetalles(detallesValidados);
                pedido.setTotalPedido(totalCalculado);

                // 5. Guardar pedido
                Pedido pedidoGuardado = pedidoRepository.save(pedido);

                log.info("✅ Pedido creado con ID: {} - Estado: {} - Total: ${}",
                                pedidoGuardado.getIdPedido(),
                                pedidoGuardado.getEstado().getDisplayName(),
                                totalCalculado);

                return pedidoGuardado;
        }

        /**
         * Confirmar pago del pedido (llamado desde webhook de MercadoPago)
         */
        public Pedido confirmarPago(Long pedidoId) {
                log.info("💳 Confirmando pago del pedido {}", pedidoId);

                Pedido pedido = pedidoRepository.findByIdWithDetalles(pedidoId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Pedido no encontrado con ID: " + pedidoId));

                // Validar estado actual
                if (pedido.getEstado() != EstadoPedido.PENDIENTE_PAGO) {
                        throw new IllegalArgumentException(
                                        "El pedido no está en estado PENDIENTE_PAGO. Estado actual: " +
                                                        pedido.getEstado().getDisplayName());
                }

                // Actualizar estado
                pedido.setEstado(EstadoPedido.PAGADO);
                pedido.setFechaActualizacionEstado(new Date());

                // AHORA SÍ descontar stock (solo cuando se confirma el pago)
                log.info("📦 Descontando stock de {} productos", pedido.getDetalles().size());
                for (DetallePedido detalle : pedido.getDetalles()) {
                        instrumentoService.actualizarStock(
                                        detalle.getInstrumento().getIdInstrumento(),
                                        detalle.getCantidad());
                }

                Pedido pedidoActualizado = pedidoRepository.save(pedido);

                log.info("✅ Pago confirmado para pedido {}. Stock actualizado.", pedidoId);

                return pedidoActualizado;
        }

        /**
         * Actualizar estado del pedido (para admin)
         */
        public Pedido actualizarEstado(Long pedidoId, EstadoPedido nuevoEstado) {
                log.info("🔄 Actualizando estado del pedido {} a {}", pedidoId, nuevoEstado);

                Pedido pedido = pedidoRepository.findByIdWithDetalles(pedidoId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Pedido no encontrado con ID: " + pedidoId));

                // Validar transición de estado
                EstadoPedido estadoActual = pedido.getEstado();

                if (!estadoActual.puedeTransicionarA(nuevoEstado)) {
                        throw new IllegalArgumentException(
                                        String.format("No se puede cambiar el estado de %s a %s",
                                                        estadoActual.getDisplayName(),
                                                        nuevoEstado.getDisplayName()));
                }

                // Actualizar estado
                pedido.setEstado(nuevoEstado);
                pedido.setFechaActualizacionEstado(new Date());

                Pedido pedidoActualizado = pedidoRepository.save(pedido);

                log.info("✅ Estado del pedido {} cambiado: {} → {}",
                                pedidoId, estadoActual, nuevoEstado);

                return pedidoActualizado;
        }

        /**
         * Cancelar pedido
         */
        public Pedido cancelarPedido(Long pedidoId, String motivo) {
                log.info("❌ Cancelando pedido {} - Motivo: {}", pedidoId, motivo);

                Pedido pedido = pedidoRepository.findByIdWithDetalles(pedidoId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Pedido no encontrado con ID: " + pedidoId));

                // Validar que no sea un estado final
                if (pedido.getEstado().esFinal()) {
                        throw new IllegalArgumentException(
                                        "No se puede cancelar un pedido en estado final: " +
                                                        pedido.getEstado().getDisplayName());
                }

                // Si el pedido ya estaba pagado o enviado, devolver stock
                if (pedido.getEstado() == EstadoPedido.PAGADO ||
                                pedido.getEstado() == EstadoPedido.ENVIADO) {

                        log.info("📦 Reponiendo stock del pedido cancelado {}", pedidoId);

                        for (DetallePedido detalle : pedido.getDetalles()) {
                                instrumentoService.reponerStock(
                                                detalle.getInstrumento().getIdInstrumento(),
                                                detalle.getCantidad());
                        }
                }

                // Actualizar estado
                pedido.setEstado(EstadoPedido.CANCELADO);
                pedido.setFechaActualizacionEstado(new Date());

                Pedido pedidoActualizado = pedidoRepository.save(pedido);

                log.info("✅ Pedido {} cancelado exitosamente", pedidoId);

                return pedidoActualizado;
        }

        /**
         * Eliminar pedido físicamente (solo PENDIENTE_PAGO sin pagar)
         */
        public void deletePedido(Long pedidoId) {
                log.info("🗑️ Eliminando pedido {}", pedidoId);

                Pedido pedido = pedidoRepository.findById(pedidoId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Pedido no encontrado con ID: " + pedidoId));

                // Solo permitir eliminar pedidos en PENDIENTE_PAGO
                if (pedido.getEstado() != EstadoPedido.PENDIENTE_PAGO) {
                        throw new IllegalArgumentException(
                                        "Solo se pueden eliminar pedidos en estado PENDIENTE_PAGO. " +
                                                        "Estado actual: " + pedido.getEstado().getDisplayName());
                }

                pedidoRepository.delete(pedido);

                log.info("✅ Pedido {} eliminado exitosamente", pedidoId);
        }

        /**
         * Obtener pedidos por estado
         */
        public List<Pedido> findByEstado(EstadoPedido estado) {
                return pedidoRepository.findByEstado(estado);
        }

        /**
         * Obtener estadísticas de pedidos
         */
        public PedidoEstadisticas obtenerEstadisticas() {
                List<Pedido> todosPedidos = pedidoRepository.findAll();

                PedidoEstadisticas stats = new PedidoEstadisticas();
                stats.setTotal(todosPedidos.size());
                stats.setPendientesPago(todosPedidos.stream()
                                .filter(p -> p.getEstado() == EstadoPedido.PENDIENTE_PAGO)
                                .count());
                stats.setPagados(todosPedidos.stream()
                                .filter(p -> p.getEstado() == EstadoPedido.PAGADO)
                                .count());
                stats.setEnviados(todosPedidos.stream()
                                .filter(p -> p.getEstado() == EstadoPedido.ENVIADO)
                                .count());
                stats.setEntregados(todosPedidos.stream()
                                .filter(p -> p.getEstado() == EstadoPedido.ENTREGADO)
                                .count());
                stats.setCancelados(todosPedidos.stream()
                                .filter(p -> p.getEstado() == EstadoPedido.CANCELADO)
                                .count());
                stats.setTotalVentas(todosPedidos.stream()
                                .filter(p -> p.getEstado() == EstadoPedido.PAGADO ||
                                                p.getEstado() == EstadoPedido.ENVIADO ||
                                                p.getEstado() == EstadoPedido.ENTREGADO)
                                .mapToDouble(Pedido::getTotalPedido)
                                .sum());

                return stats;
        }

        /**
         * Clase interna para estadísticas
         */
        @lombok.Data
        public static class PedidoEstadisticas {
                private int total;
                private long pendientesPago;
                private long pagados;
                private long enviados;
                private long entregados;
                private long cancelados;
                private double totalVentas;
        }

        // ✅ NUEVOS MÉTODOS para gestionar pedidos pendientes

        /**
         * Obtener pedido pendiente del usuario
         */
        public Optional<Pedido> obtenerPedidoPendiente(Long usuarioId) {
                log.info("🔍 Buscando pedido pendiente para usuario: {}", usuarioId);

                Usuario usuario = usuarioRepository.findById(usuarioId)
                                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

                return pedidoRepository.findByUsuarioAndEstado(usuario, EstadoPedido.PENDIENTE_PAGO);
        }

        /**
         * Verificar si tiene pedido pendiente
         */
        public boolean tienePedidoPendiente(Long usuarioId) {
                return pedidoRepository.existsByUsuarioAndEstado(usuarioId, EstadoPedido.PENDIENTE_PAGO);
        }

        /**
         * Obtener información de pedido pendiente para el frontend
         */
        public Optional<Pedido> obtenerPedidoPendienteCompleto(Long usuarioId) {
                Usuario usuario = usuarioRepository.findById(usuarioId)
                                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

                Optional<Pedido> pedidoOpt = pedidoRepository.findByUsuarioAndEstado(usuario,
                                EstadoPedido.PENDIENTE_PAGO);

                if (pedidoOpt.isPresent()) {
                        // Cargar con detalles para el frontend
                        return pedidoRepository.findByIdWithDetalles(pedidoOpt.get().getIdPedido());
                }

                return Optional.empty();
        }
}
