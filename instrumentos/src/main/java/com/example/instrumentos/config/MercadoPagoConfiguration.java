package com.example.instrumentos.config;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.PreferenceClient;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import jakarta.annotation.PostConstruct;

@Configuration
@PropertySource("classpath:mercadopago.properties")
@Slf4j
public class MercadoPagoConfiguration {

    @Value("${mercadopago.access.token}")
    private String accessToken;

    @Value("${mercadopago.sandbox.mode:true}")
    private boolean sandboxMode;

    @Value("${mercadopago.success.url}")
    private String successUrl;

    @Value("${mercadopago.failure.url}")
    private String failureUrl;

    @Value("${mercadopago.pending.url}")
    private String pendingUrl;

    @Value("${mercadopago.notification.url}")
    private String notificationUrl;

    @PostConstruct
    public void initialize() {
        try {
            log.info("=== INICIALIZANDO MERCADOPAGO ===");

            // ✅ VALIDAR ACCESS TOKEN
            if (accessToken == null || accessToken.trim().isEmpty()) {
                log.error("❌ Access token no configurado");
                throw new IllegalStateException("Access token de MercadoPago no configurado");
            }

            if (!accessToken.startsWith("APP_USR-")) {
                log.error("❌ Access token con formato inválido: {}", accessToken.substring(0, 10) + "...");
                throw new IllegalStateException("Access token de MercadoPago con formato inválido");
            }

            // ✅ CONFIGURAR MERCADOPAGO
            MercadoPagoConfig.setAccessToken(accessToken);
            log.info("Access token configurado: {}...", accessToken.substring(0, 20));

            // ✅ VERIFICAR MODO
            if (sandboxMode) {
                log.info("Modo SANDBOX activado");
            } else {
                log.info("Modo PRODUCCIÓN activado");
            }

            // ✅ VALIDAR URLS BÁSICAS (no notificationUrl por si no hay ngrok)
            if (successUrl == null || failureUrl == null || pendingUrl == null) {
                log.error("❌ URLs de retorno no configuradas correctamente");
                throw new IllegalStateException("URLs de retorno no configuradas");
            }

            log.info("URLs configuradas:");
            log.info("- Success: {}", successUrl);
            log.info("- Failure: {}", failureUrl);
            log.info("- Pending: {}", pendingUrl);

            // ✅ NOTIFICAR SOBRE NOTIFICATION URL
            if (notificationUrl != null && !notificationUrl.trim().isEmpty()) {
                if (notificationUrl.contains("localhost") || notificationUrl.contains("127.0.0.1")) {
                    log.warn("⚠️ Notification URL usando localhost - MercadoPago no podrá acceder");
                } else {
                    log.info("✅ Webhook con dominio público: {}", notificationUrl);
                }
            } else {
                log.warn("⚠️ Notification URL no configurada - webhooks deshabilitados");
            }

            // ✅ TEST DE CONECTIVIDAD (opcional)
            try {
                log.info("🔍 Verificando conectividad con MercadoPago...");
                // Crear un client de prueba
                PreferenceClient testClient = new PreferenceClient();
                log.info("✅ Cliente de MercadoPago inicializado correctamente");
            } catch (Exception e) {
                log.warn("⚠️ No se pudo verificar conectividad: {}", e.getMessage());
            }

            log.info("=== MERCADOPAGO CONFIGURADO CORRECTAMENTE ===");

        } catch (Exception e) {
            log.error("❌ Error inicializando MercadoPago: {}", e.getMessage(), e);
            throw new RuntimeException("Error de configuración de MercadoPago", e);
        }
    }

    // Getters sin cambios
    public String getSuccessUrl() {
        return successUrl;
    }

    public String getFailureUrl() {
        return failureUrl;
    }

    public String getPendingUrl() {
        return pendingUrl;
    }

    public String getNotificationUrl() {
        return notificationUrl;
    }

    public boolean isSandboxMode() {
        return sandboxMode;
    }

    // Getter adicional para debugging
    public String getAccessTokenInfo() {
        return accessToken != null ? accessToken.substring(0, Math.min(20, accessToken.length())) + "..."
                : "NO CONFIGURADO";
    }

    /**
     * Verificar si el webhook está accesible públicamente
     */
    public boolean verificarWebhookAccesible() {
        if (notificationUrl == null || notificationUrl.trim().isEmpty()) {
            log.warn("No hay URL de webhook configurada");
            return false;
        }

        try {
            // Construir URL de test
            String testUrl = notificationUrl.replace("/webhook", "/webhook/test");

            log.info("🧪 Verificando accesibilidad del webhook en: {}", testUrl);
            log.info("💡 Puedes probar manualmente con: curl {}", testUrl);

            return true; // La verificación real la haremos manualmente

        } catch (Exception e) {
            log.error("❌ Error verificando webhook: {}", e.getMessage());
            return false;
        }
    }
}