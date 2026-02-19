package com.example.instrumentos.service;

import com.example.instrumentos.config.MercadoPagoConfiguration;
import com.example.instrumentos.model.*;
import com.example.instrumentos.repository.PagoRepository;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferencePayerRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.net.MPResultsResourcesPage;
import com.mercadopago.net.MPSearchRequest;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Async;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PagoService {

    private final PagoRepository pagoRepository;
    private final PedidoService pedidoService;
    private final MercadoPagoConfiguration mercadoPagoConfig;

    // ✅ CACHE OPTIMIZADO PARA EVITAR CONSULTAS REPETITIVAS
    private final Map<String, String> estadoCache = new ConcurrentHashMap<>();
    private final Map<String, Long> tiempoCache = new ConcurrentHashMap<>();
    private final Map<String, String> paymentIdCache = new ConcurrentHashMap<>();
    private final long CACHE_TTL = 30000; // 30 segundos

    /**
     * Crear pago para un pedido mediante MercadoPago
     */
    public Map<String, String> crearPago(Long pedidoId) throws MPException, MPApiException {
        log.info("🚀 Iniciando creación de pago para pedido ID: {}", pedidoId);

        try {
            // 1. Validaciones iniciales
            Pedido pedido = validarPedidoParaPago(pedidoId);
            Double total = pedido.getTotalPedido();

            log.info("📋 Pedido validado: ID={}, Total=${}", pedido.getIdPedido(), total);

            // 2. Crear registro de pago en BD
            Pago pago = crearRegistroPagoInicial(pedido, total);

            // 3. Preparar items para MercadoPago
            List<PreferenceItemRequest> items = prepararItemsMercadoPago(pedido);

            // 4. Configurar URLs de retorno
            PreferenceBackUrlsRequest backUrls = configurarURLsRetorno(pedidoId);

            // 5. Crear y enviar preferencia a MercadoPago
            Preference preference = crearPreferenciaMercadoPago(items, backUrls, pedidoId, pago);

            // 6. Actualizar registro de pago con preference ID
            pago.setMercadoPagoPreferenceId(preference.getId());
            pagoRepository.save(pago);

            log.info("✅ Proceso completado exitosamente para pedido {} - Preference ID: {}",
                    pedidoId, preference.getId());

            return construirRespuestaPago(preference, pedidoId);

        } catch (Exception e) {
            log.error("❌ Error crear pago para pedido {}: {}", pedidoId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Procesar notificación de pago desde webhook (ASÍNCRONO)
     */
    @Async
    public CompletableFuture<Void> procesarNotificacionPagoAsync(String paymentId) {
        return CompletableFuture.runAsync(() -> procesarNotificacionPago(paymentId));
    }

    /**
     * Procesar notificación de pago desde webhook de MercadoPago
     */
    public void procesarNotificacionPago(String paymentId) {
        try {
            log.info("🔍 Procesando notificación de pago ID: {}", paymentId);

            // ✅ Obtener información del pago desde MercadoPago
            PaymentClient paymentClient = new PaymentClient();
            Payment payment = paymentClient.get(Long.valueOf(paymentId));

            if (payment == null) {
                log.error("❌ No se pudo obtener información del pago desde MercadoPago: {}", paymentId);
                return;
            }

            // ✅ Extraer y validar información
            String externalReference = payment.getExternalReference();
            String status = payment.getStatus();
            String statusDetail = payment.getStatusDetail();
            BigDecimal transactionAmount = payment.getTransactionAmount();

            log.info("📄 Información del pago:");
            log.info("- Payment ID: {}", paymentId);
            log.info("- External Reference (Pedido ID): {}", externalReference);
            log.info("- Status: {}", status);
            log.info("- Status Detail: {}", statusDetail);
            log.info("- Amount: {}", transactionAmount);

            if (externalReference == null || externalReference.trim().isEmpty()) {
                log.error("❌ External reference vacía. No se puede identificar el pedido");
                return;
            }

            // ✅ Buscar y actualizar pago en BD
            Long pedidoId = Long.valueOf(externalReference);
            Optional<Pago> pagoOpt = buscarPagoPendiente(pedidoId);

            if (pagoOpt.isEmpty()) {
                log.error("❌ No se encontró pago pendiente para pedido ID: {}", pedidoId);
                return;
            }

            Pago pago = pagoOpt.get();
            String estadoAnterior = pago.getEstado();

            // ✅ Actualizar información del pago
            actualizarEstadoPago(pago, status, paymentId);

            // ⚡ INVALIDAR Y ACTUALIZAR CACHE INMEDIATAMENTE
            if (pago.getMercadoPagoPreferenceId() != null) {
                String preferenceId = pago.getMercadoPagoPreferenceId();

                // ✅ Actualizar cache con el nuevo estado
                actualizarCache(preferenceId, status);
                paymentIdCache.put(preferenceId, paymentId);

                log.info("⚡ Cache actualizado inmediatamente - Preference: {}, Estado: {}",
                        preferenceId, status);
            }

            // ✅ Procesar según el estado
            procesarCambioEstadoPago(pago, status, estadoAnterior, statusDetail);

        } catch (Exception e) {
            log.error("❌ Error procesando notificación de pago {}: {}", paymentId, e.getMessage(), e);
        }
    }

    /**
     * Verificación optimizada que evita búsquedas redundantes
     */
    public String verificarYActualizarPago(String preferenceId) {
        log.info("🔍 Verificación iniciada para preference_id: {}", preferenceId);

        try {
            // ✅ 1. VERIFICAR CACHE PRIMERO (más agresivo)
            String estadoCacheado = obtenerEstadoCache(preferenceId);
            if (estadoCacheado != null) {
                if ("approved".equals(estadoCacheado)) {
                    log.info("⚡ Estado 'approved' obtenido desde cache (sin consultar BD)");
                    return estadoCacheado;
                } else if (System.currentTimeMillis() - tiempoCache.get(preferenceId) < 5000) { // Cache válido por 5
                                                                                                // segundos
                    log.info("⚡ Estado '{}' obtenido desde cache reciente", estadoCacheado);
                    return estadoCacheado;
                }
            }

            // ✅ 2. BUSCAR PAGO EN BD
            Optional<Pago> pagoOpt = pagoRepository.findByMercadoPagoPreferenceId(preferenceId);
            if (pagoOpt.isEmpty()) {
                throw new IllegalArgumentException("No se encontró un pago para la preferencia dada.");
            }

            Pago pagoInterno = pagoOpt.get();

            // ✅ 3. SI YA ESTÁ APROBADO EN BD, NO CONSULTAR MP
            if ("approved".equals(pagoInterno.getEstado())) {
                log.info("⚡ Pago ya aprobado en BD (sin consultar MercadoPago)");
                actualizarCache(preferenceId, "approved");
                return "approved";
            }

            // ✅ 4. VERIFICAR SI EL PAYMENT ID ESTÁ EN CACHE
            String paymentIdCacheado = paymentIdCache.get(preferenceId);
            if (paymentIdCacheado != null || (pagoInterno.getMercadoPagoPaymentId() != null
                    && !pagoInterno.getMercadoPagoPaymentId().trim().isEmpty())) {
                String paymentId = paymentIdCacheado != null ? paymentIdCacheado
                        : pagoInterno.getMercadoPagoPaymentId();
                String resultado = consultarPorPaymentId(pagoInterno, paymentId, preferenceId);
                actualizarCache(preferenceId, resultado);
                return resultado;
            }

            // ✅ 5. BÚSQUEDA POR EXTERNAL_REFERENCE (solo como último recurso)
            log.info("🔍 Consulta por external_reference como fallback...");
            String resultado = buscarPorExternalReferenceSafe(pagoInterno, preferenceId);
            actualizarCache(preferenceId, resultado);
            return resultado;

        } catch (Exception e) {
            log.error("❌ Error en verificación: {}", e.getMessage());
            // ✅ En caso de error, devolver estado de BD sin lanzar excepción
            Optional<Pago> pagoOpt = pagoRepository.findByMercadoPagoPreferenceId(preferenceId);
            if (pagoOpt.isPresent()) {
                String estadoBD = pagoOpt.get().getEstado();
                log.info("🔙 Devolviendo estado de BD como fallback: {}", estadoBD);
                return estadoBD;
            }
            throw new RuntimeException("Error al verificar estado del pago", e);
        }
    }

    /**
     * Búsqueda por external_reference con manejo seguro de errores
     */
    private String buscarPorExternalReferenceSafe(Pago pagoInterno, String preferenceId) {
        try {
            PaymentClient client = new PaymentClient();
            String externalReference = String.valueOf(pagoInterno.getPedido().getIdPedido());

            log.debug("🔍 Buscando pagos con external_reference: {}", externalReference);

            // ✅ FILTROS SIMPLIFICADOS - sin parámetros que causen null
            Map<String, Object> filters = new HashMap<>();
            filters.put("external_reference", externalReference);

            MPSearchRequest searchRequest = MPSearchRequest.builder()
                    .filters(filters)
                    .build();

            MPResultsResourcesPage<Payment> paymentsPage = client.search(searchRequest);
            List<Payment> payments = paymentsPage.getResults();

            log.info("📥 MercadoPago devolvió {} pago(s)", payments.size());

            if (payments.isEmpty()) {
                log.warn("⚠️ No se encontraron pagos para external_reference: {}", externalReference);
                return pagoInterno.getEstado(); // Devolver estado actual
            }

            // ✅ Obtener el pago más reciente
            Payment ultimoPago = payments.stream()
                    .filter(p -> p.getDateCreated() != null)
                    .max(Comparator.comparing(Payment::getDateCreated))
                    .orElse(payments.get(0));

            String estadoMP = ultimoPago.getStatus();
            String paymentId = ultimoPago.getId().toString();

            log.info("🎯 Último pago encontrado: ID {}, Estado {}", paymentId, estadoMP);

            // ✅ Actualizar si hay cambios
            if (!pagoInterno.getEstado().equals(estadoMP)) {
                actualizarEstadoPago(pagoInterno, estadoMP, paymentId);
            }

            // ✅ Actualizar caches
            paymentIdCache.put(preferenceId, paymentId);
            return estadoMP;

        } catch (Exception e) {
            log.warn("⚠️ Error en búsqueda por external_reference (no crítico): {}", e.getMessage());
            // ✅ Devolver estado actual de BD en lugar de fallar
            return pagoInterno.getEstado();
        }
    }

    // ===== MÉTODOS PRIVADOS DE SOPORTE =====

    /**
     * Validar pedido para pago
     */
    private Pedido validarPedidoParaPago(Long pedidoId) {
        Pedido pedido = pedidoService.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + pedidoId));

        if (pedido.getEstado() != EstadoPedido.PENDIENTE_PAGO) {
            throw new IllegalArgumentException(
                    "El pedido no está en estado PENDIENTE_PAGO. Estado actual: " + pedido.getEstado());
        }

        if (pedido.getDetalles() == null || pedido.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("El pedido no tiene detalles");
        }

        Double total = pedido.getTotalPedido();
        if (total == null || total <= 0) {
            throw new IllegalArgumentException("El total del pedido debe ser mayor a cero. Total: " + total);
        }

        // ✅ Verificar que no exista un pago aprobado previo
        if (pagoRepository.findByPedido_IdPedidoAndEstado(pedidoId, "approved").isPresent()) {
            throw new IllegalArgumentException("El pedido ya tiene un pago aprobado");
        }

        return pedido;
    }

    /**
     * Crear registro inicial de pago en BD
     */
    private Pago crearRegistroPagoInicial(Pedido pedido, Double total) {
        Pago pago = new Pago();
        pago.setPedido(pedido);
        pago.setMonto(total);
        pago.setDescripcion("Pago del pedido #" + pedido.getIdPedido());
        pago.setEstado("pending");
        pago.setFechaCreacion(new Date());
        return pago;
    }

    /**
     * Preparar items para MercadoPago
     */
    private List<PreferenceItemRequest> prepararItemsMercadoPago(Pedido pedido) {
        List<PreferenceItemRequest> items = new ArrayList<>();

        for (DetallePedido detalle : pedido.getDetalles()) {
            Instrumento instrumento = detalle.getInstrumento();

            if (instrumento == null) {
                throw new IllegalArgumentException(
                        "Detalle sin instrumento asociado. DetallePedidoId: " + detalle.getIdDetallePedido());
            }

            Double precioUnitario = detalle.getPrecioUnitario();
            if (precioUnitario == null || precioUnitario <= 0) {
                throw new IllegalArgumentException(
                        "Precio inválido para instrumento: " + instrumento.getDenominacion());
            }

            // ✅ Preparar título (máximo 60 caracteres)
            String title = instrumento.getDenominacion().trim();
            if (title.length() > 60) {
                title = title.substring(0, 57) + "...";
            }

            PreferenceItemRequest item = PreferenceItemRequest.builder()
                    .title(title)
                    .description(instrumento.getMarca())
                    .quantity(detalle.getCantidad())
                    .unitPrice(BigDecimal.valueOf(precioUnitario))
                    .currencyId("ARS")
                    .build();

            items.add(item);
            log.debug("✅ Item agregado: {} - ${} x {}", title, precioUnitario, detalle.getCantidad());
        }

        log.info("📦 Total de items preparados: {}", items.size());
        return items;
    }

    /**
     * Configurar URLs de retorno
     */
    private PreferenceBackUrlsRequest configurarURLsRetorno(Long pedidoId) {
        String successUrl = buildRedirectUrl(mercadoPagoConfig.getSuccessUrl(), pedidoId);
        String failureUrl = buildRedirectUrl(mercadoPagoConfig.getFailureUrl(), pedidoId);
        String pendingUrl = buildRedirectUrl(mercadoPagoConfig.getPendingUrl(), pedidoId);

        log.info("🔗 URLs configuradas:");
        log.info("- Success: {}", successUrl);
        log.info("- Failure: {}", failureUrl);
        log.info("- Pending: {}", pendingUrl);

        return PreferenceBackUrlsRequest.builder()
                .success(successUrl)
                .failure(failureUrl)
                .pending(pendingUrl)
                .build();
    }

    /**
     * Crear preferencia en MercadoPago
     */
    private Preference crearPreferenciaMercadoPago(List<PreferenceItemRequest> items,
            PreferenceBackUrlsRequest backUrls,
            Long pedidoId,
            Pago pago) throws MPException, MPApiException {

        try {
            // ✅ VERIFICAR CONFIGURACIÓN DE MERCADOPAGO
            String accessToken = MercadoPagoConfig.getAccessToken();
            log.info("🔐 Access token configurado: {}...", accessToken != null ? accessToken.substring(0, 20) : "NULL");

            // ✅ PREPARAR PAYER
            PreferencePayerRequest payer = PreferencePayerRequest.builder()
                    .email("test_user_8621830017045034568@testuser.com")
                    .name("Test")
                    .surname("Test")
                    .build();

            // ✅ CREAR REQUEST SIN AUTO_RETURN (más compatible)
            PreferenceRequest.PreferenceRequestBuilder requestBuilder = PreferenceRequest.builder()
                    .items(items)
                    .backUrls(backUrls)
                    .payer(payer)
                    .externalReference(pedidoId.toString())
                    .expires(false)
                    .autoReturn("approved");

            // ✅ CONFIGURAR NOTIFICATION URL SOLO SI ESTÁ DISPONIBLE
            if (mercadoPagoConfig.getNotificationUrl() != null
                    && !mercadoPagoConfig.getNotificationUrl().trim().isEmpty()) {
                String notificationUrl = mercadoPagoConfig.getNotificationUrl();
                requestBuilder.notificationUrl(notificationUrl);
                log.info("🌐 Notification URL configurada: {}", notificationUrl);
            } else {
                log.warn("⚠️ Notification URL no configurada - continuando sin webhook");
            }

            // ✅ CONFIGURAR STATEMENT DESCRIPTOR
            try {
                requestBuilder.statementDescriptor("Musical Hendrix");
            } catch (Exception e) {
                log.warn("⚠️ No se pudo configurar statement descriptor: {}", e.getMessage());
            }

            PreferenceRequest preferenceRequest = requestBuilder.build();

            // ✅ LOGGING DETALLADO DEL REQUEST
            log.info("📋 === DATOS DE LA PREFERENCIA ===");
            log.info("External Reference: {}", preferenceRequest.getExternalReference());
            log.info("Items count: {}", preferenceRequest.getItems().size());
            log.info("Payer email: {}", preferenceRequest.getPayer().getEmail());
            log.info("Auto Return: {}", preferenceRequest.getAutoReturn()); // Debería ser null ahora
            log.info("Expires: {}", preferenceRequest.getExpires());
            log.info("================================");

            // ✅ VALIDAR ITEMS ANTES DE ENVIAR
            for (int i = 0; i < items.size(); i++) {
                PreferenceItemRequest item = items.get(i);
                log.info("Item {}: Title='{}', Quantity={}, Price={}, CurrencyId={}",
                        i, item.getTitle(), item.getQuantity(), item.getUnitPrice(), item.getCurrencyId());

                if (item.getTitle() == null || item.getTitle().trim().isEmpty()) {
                    throw new IllegalArgumentException("Item " + i + " tiene título vacío");
                }
                if (item.getQuantity() == null || item.getQuantity() <= 0) {
                    throw new IllegalArgumentException("Item " + i + " tiene cantidad inválida: " + item.getQuantity());
                }
                if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Item " + i + " tiene precio inválido: " + item.getUnitPrice());
                }
            }

            log.info("📡 Enviando preferencia a MercadoPago...");

            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(preferenceRequest);

            log.info("✅ Preferencia creada exitosamente");
            log.info("Preference ID: {}", preference.getId());

            if (mercadoPagoConfig.isSandboxMode()) {
                log.info("🧪 Sandbox Init Point: {}", preference.getSandboxInitPoint());
            } else {
                log.info("🌐 Production Init Point: {}", preference.getInitPoint());
            }

            return preference;

        } catch (MPApiException e) {
            log.error("❌ Error de API de MercadoPago:");
            log.error("Status Code: {}", e.getStatusCode());
            log.error("Message: {}", e.getMessage());

            // ✅ EXTRAER DETALLES DE LA RESPUESTA
            if (e.getApiResponse() != null) {
                try {
                    String responseContent = e.getApiResponse().getContent();
                    log.error("Response Content: {}", responseContent);

                    // ✅ PARSEAR ERRORES ESPECÍFICOS
                    if (responseContent != null && responseContent.contains("message")) {
                        try {
                            // Intentar parsear el JSON de error
                            log.error("Detalles del error de MercadoPago: {}", responseContent);
                        } catch (Exception parseEx) {
                            log.error("No se pudo parsear la respuesta de error");
                        }
                    }
                } catch (Exception ex) {
                    log.error("No se pudo obtener contenido de la respuesta de error");
                }
            }

            throw new RuntimeException("Error al crear preferencia en MercadoPago: " + e.getMessage(), e);

        } catch (MPException e) {
            log.error("❌ Error de SDK de MercadoPago:");
            log.error("Message: {}", e.getMessage());
            log.error("Cause: {}", e.getCause());

            throw new RuntimeException("Error de conexión con MercadoPago: " + e.getMessage(), e);

        } catch (Exception e) {
            log.error("❌ Error inesperado al crear preferencia:");
            log.error("Type: {}", e.getClass().getSimpleName());
            log.error("Message: {}", e.getMessage());
            log.error("Stack trace:", e);

            throw new RuntimeException("Error inesperado al crear la preferencia de pago", e);
        }
    }

    /**
     * Construir respuesta de pago
     */
    private Map<String, String> construirRespuestaPago(Preference preference, Long pedidoId) {
        Map<String, String> response = new HashMap<>();
        response.put("preference_id", preference.getId());
        response.put("pedido_id", pedidoId.toString());

        // ✅ Usar sandbox o producción según configuración
        if (mercadoPagoConfig.isSandboxMode()) {
            response.put("init_point", preference.getSandboxInitPoint());
        } else {
            response.put("init_point", preference.getInitPoint());
        }

        return response;
    }

    /**
     * Consultar estado en MercadoPago (optimizado)
     */
    private String consultarEstadoMercadoPago(Pago pagoInterno, String preferenceId) {
        try {
            // ✅ 1. SI TENEMOS PAYMENT ID, CONSULTA DIRECTA (MÁS RÁPIDA)
            String paymentIdCacheado = paymentIdCache.get(preferenceId);
            String paymentIdBD = pagoInterno.getMercadoPagoPaymentId();

            if (paymentIdBD != null && !paymentIdBD.trim().isEmpty()) {
                return consultarPorPaymentId(pagoInterno, paymentIdBD, preferenceId);
            } else if (paymentIdCacheado != null) {
                return consultarPorPaymentId(pagoInterno, paymentIdCacheado, preferenceId);
            }

            // ✅ 2. BÚSQUEDA POR EXTERNAL_REFERENCE (fallback)
            log.info("🔍 Búsqueda por external_reference...");
            return buscarPorExternalReference(pagoInterno, preferenceId);

        } catch (Exception e) {
            log.error("❌ Error consultando MercadoPago: {}", e.getMessage());
            return pagoInterno.getEstado();
        }
    }

    /**
     * Consultar por Payment ID (método más rápido)
     */
    private String consultarPorPaymentId(Pago pagoInterno, String paymentId, String preferenceId) {
        try {
            log.info("⚡ Consulta directa por payment ID: {}", paymentId);

            PaymentClient paymentClient = new PaymentClient();
            Payment payment = paymentClient.get(Long.valueOf(paymentId));

            if (payment != null) {
                String estadoMP = payment.getStatus();
                log.info("📥 Estado desde MP: {}", estadoMP);

                if (!pagoInterno.getEstado().equals(estadoMP)) {
                    actualizarEstadoPago(pagoInterno, estadoMP, paymentId);
                }

                return estadoMP;
            }
        } catch (Exception e) {
            log.warn("⚠️ Error en consulta directa: {}", e.getMessage());
        }

        return pagoInterno.getEstado();
    }

    /**
     * Buscar por external reference (fallback)
     */
    private String buscarPorExternalReference(Pago pagoInterno, String preferenceId) {
        try {
            PaymentClient client = new PaymentClient();
            String externalReference = String.valueOf(pagoInterno.getPedido().getIdPedido());

            log.info("🔍 Buscando pagos con external_reference: {}", externalReference);

            // ✅ FILTROS SIMPLIFICADOS
            Map<String, Object> filters = new HashMap<>();
            filters.put("external_reference", externalReference);

            MPSearchRequest searchRequest = MPSearchRequest.builder()
                    .filters(filters)
                    .build();

            MPResultsResourcesPage<Payment> paymentsPage = client.search(searchRequest);
            List<Payment> payments = paymentsPage.getResults();

            log.info("📥 MercadoPago devolvió {} pago(s)", payments.size());

            if (payments.isEmpty()) {
                log.warn("⚠️ No se encontraron pagos para external_reference: {}", externalReference);
                return pagoInterno.getEstado();
            }

            // ✅ Obtener el pago más reciente
            Payment ultimoPago = payments.stream()
                    .filter(p -> p.getDateCreated() != null)
                    .max(Comparator.comparing(Payment::getDateCreated))
                    .orElse(payments.get(0));

            String estadoMP = ultimoPago.getStatus();
            String paymentId = ultimoPago.getId().toString();

            log.info("🎯 Último pago: ID {}, Estado {}", paymentId, estadoMP);

            // ✅ Actualizar si hay cambios
            if (!pagoInterno.getEstado().equals(estadoMP)) {
                actualizarEstadoPago(pagoInterno, estadoMP, paymentId);
            }

            // ✅ Actualizar cache
            paymentIdCache.put(preferenceId, paymentId);

            return estadoMP;

        } catch (Exception e) {
            log.error("❌ Error en búsqueda por external_reference: {}", e.getMessage());
            return pagoInterno.getEstado();
        }
    }

    /**
     * Buscar pago pendiente por pedido ID
     */
    private Optional<Pago> buscarPagoPendiente(Long pedidoId) {
        return pagoRepository.findByPedido_IdPedido(pedidoId)
                .stream()
                .filter(p -> "pending".equals(p.getEstado()) || "in_process".equals(p.getEstado()))
                .findFirst();
    }

    /**
     * Procesar cambio de estado de pago
     */
    private void procesarCambioEstadoPago(Pago pago, String nuevoEstado, String estadoAnterior, String statusDetail) {
        switch (nuevoEstado.toLowerCase()) {
            case "approved":
                if (!"approved".equalsIgnoreCase(estadoAnterior)) {
                    confirmarPedidoPagado(pago.getPedido().getIdPedido(), pago);
                }
                break;

            case "rejected":
            case "cancelled":
                manejarPagoRechazado(pago.getPedido().getIdPedido(), pago, statusDetail);
                break;

            case "pending":
            case "in_process":
            case "in_mediation":
                log.info("⏳ Pago {} en proceso. Estado: {}", pago.getIdPago(), nuevoEstado);
                break;

            default:
                log.warn("⚠️ Estado no reconocido: {}", nuevoEstado);
        }
    }

    /**
     * Actualizar estado de pago (método optimizado)
     */
    private void actualizarEstadoPago(Pago pago, String nuevoEstado, String paymentId) {
        String estadoAnterior = pago.getEstado();

        pago.setEstado(nuevoEstado);
        pago.setMercadoPagoPaymentId(paymentId);
        pago.setFechaActualizacion(new Date());

        if ("approved".equals(nuevoEstado) && !estadoAnterior.equals("approved")) {
            confirmarPedidoPagado(pago.getPedido().getIdPedido(), pago);
        }

        pagoRepository.save(pago);
        log.info("💾 Estado actualizado: {} → {}", estadoAnterior, nuevoEstado);
    }

    // ===== MÉTODOS DE CACHE =====

    private String obtenerEstadoCache(String preferenceId) {
        Long tiempo = tiempoCache.get(preferenceId);
        if (tiempo != null && (System.currentTimeMillis() - tiempo) < CACHE_TTL) {
            return estadoCache.get(preferenceId);
        }
        return null;
    }

    private void actualizarCache(String preferenceId, String estado) {
        estadoCache.put(preferenceId, estado);
        tiempoCache.put(preferenceId, System.currentTimeMillis());
    }

    // ===== MÉTODOS DE CONFIRMACIÓN =====

    private void confirmarPedidoPagado(Long pedidoId, Pago pago) {
        try {
            log.info("✅ Confirmando pago aprobado para pedido: {}", pedidoId);

            // ✅ Verificar estado actual antes de confirmar
            Optional<com.example.instrumentos.model.Pedido> pedidoOpt = pedidoService.findById(pedidoId);
            if (pedidoOpt.isEmpty()) {
                log.error("❌ Pedido no encontrado: {}", pedidoId);
                return;
            }

            com.example.instrumentos.model.Pedido pedido = pedidoOpt.get();
            EstadoPedido estadoActual = pedido.getEstado();

            // ✅ Si ya está pagado, es una confirmación duplicada (OK)
            if (EstadoPedido.PAGADO.equals(estadoActual)) {
                log.info("ℹ️ Pedido {} ya está confirmado (estado: {}). Webhook duplicado ignorado.", pedidoId,
                        estadoActual);
                return;
            }

            // ✅ Si está pendiente, confirmar normalmente
            if (EstadoPedido.PENDIENTE_PAGO.equals(estadoActual)) {
                pedidoService.confirmarPago(pedidoId);
                log.info("🎉 Pedido {} confirmado exitosamente: {} → PAGADO", pedidoId, estadoActual);
            } else {
                log.warn("⚠️ Pedido {} en estado inesperado para confirmación: {}", pedidoId, estadoActual);
            }

        } catch (IllegalArgumentException e) {
            // ✅ Manejo específico para pedidos ya pagados
            if (e.getMessage().contains("no está en estado PENDIENTE_PAGO")) {
                log.info("ℹ️ Pedido {} ya procesado anteriormente. Webhook duplicado.", pedidoId);
            } else {
                log.warn("⚠️ Error de validación al confirmar pedido {}: {}", pedidoId, e.getMessage());
            }
        } catch (Exception e) {
            log.error("❌ Error inesperado confirmando pedido {}: {}", pedidoId, e.getMessage(), e);
        }
    }

    private void manejarPagoRechazado(Long pedidoId, Pago pago, String statusDetail) {
        try {
            log.warn("❌ Pago rechazado para pedido: {}. Detalle: {}", pedidoId, statusDetail);
            log.info("📝 Pedido {} permanece en PENDIENTE_PAGO para reintento", pedidoId);
        } catch (Exception e) {
            log.error("❌ Error manejando pago rechazado {}: {}", pedidoId, e.getMessage(), e);
        }
    }

    // ===== MÉTODOS PÚBLICOS DE CONSULTA =====

    public List<Pago> obtenerPagosPorPedido(Long pedidoId) {
        return pagoRepository.findByPedido_IdPedido(pedidoId);
    }

    public Optional<Pago> obtenerUltimoPagoPorPedido(Long pedidoId) {
        List<Pago> pagos = pagoRepository.findByPedido_IdPedido(pedidoId);
        return pagos.stream()
                .max(Comparator.comparing(Pago::getFechaCreacion));
    }

    public Optional<Pago> obtenerPago(Long pagoId) {
        return pagoRepository.findById(pagoId);
    }

    public boolean tienePagoAprobado(Long pedidoId) {
        return pagoRepository.findByPedido_IdPedidoAndEstado(pedidoId, "approved").isPresent();
    }

    // ===== MÉTODOS DE UTILIDAD =====

    private String buildRedirectUrl(String baseUrl, Long pedidoId) {
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("URL de redirección no configurada");
        }

        String finalUrl;
        if (baseUrl.contains("?")) {
            finalUrl = baseUrl + "&pedido_id=" + pedidoId;
        } else {
            finalUrl = baseUrl + "?pedido_id=" + pedidoId;
        }

        log.debug("🔗 URL construida: {} + pedidoId={} = {}", baseUrl, pedidoId, finalUrl);
        return finalUrl;
    }
}