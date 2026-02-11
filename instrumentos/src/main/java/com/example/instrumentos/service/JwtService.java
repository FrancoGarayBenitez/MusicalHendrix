package com.example.instrumentos.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j; // ✅ AGREGADO para logging
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j // ✅ AGREGADO
public class JwtService {

    @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}") // 24 horas por defecto (en milisegundos)
    private long jwtExpiration;

    /**
     * Extraer el username (email) del token JWT
     *
     * @param token Token JWT
     * @return Email del usuario
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extraer una claim específica del token JWT
     *
     * @param token          Token JWT
     * @param claimsResolver Función para extraer la claim
     * @param <T>            Tipo de dato de la claim
     * @return Valor de la claim
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Generar token JWT con claims adicionales (rol, etc.)
     *
     * @param extraClaims Claims adicionales a incluir en el token
     * @param userDetails Información del usuario
     * @return Token JWT generado
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        log.debug("🔐 Generando token JWT para usuario: {}", userDetails.getUsername());
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    /**
     * Generar token JWT simple (sin claims adicionales)
     *
     * @param userDetails Información del usuario
     * @return Token JWT generado
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Validar si el token JWT es válido
     * - El username debe coincidir con el UserDetails
     * - El token no debe estar expirado
     *
     * @param token       Token JWT a validar
     * @param userDetails UserDetails del usuario autenticado
     * @return true si el token es válido, false en caso contrario
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            boolean isValid = username.equals(userDetails.getUsername()) && !isTokenExpired(token);

            if (!isValid) {
                log.warn("⚠️ Token inválido para usuario: {}", userDetails.getUsername());
            }

            return isValid;
        } catch (Exception e) {
            log.error("❌ Error al validar token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verificar si el token JWT está expirado
     *
     * @param token Token JWT
     * @return true si está expirado, false en caso contrario
     */
    private boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        boolean expired = expiration.before(new Date());

        if (expired) {
            log.debug("⏰ Token expirado en: {}", expiration);
        }

        return expired;
    }

    /**
     * Extraer fecha de expiración del token JWT
     *
     * @param token Token JWT
     * @return Fecha de expiración
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Construir el token JWT con todas las claims necesarias
     *
     * @param extraClaims Claims adicionales (rol, etc.)
     * @param userDetails Información del usuario
     * @param expiration  Tiempo de expiración en milisegundos
     * @return Token JWT firmado
     */
    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration) {

        Date now = new Date(System.currentTimeMillis());
        Date expirationDate = new Date(System.currentTimeMillis() + expiration);

        // ✅ incluir roles del UserDetails en el JWT (útil para debug en frontend)
        var roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        log.debug("📝 Creando token JWT - Usuario: {}, Expira: {}, Roles: {}",
                userDetails.getUsername(), expirationDate, roles);

        return Jwts
                .builder()
                .setClaims(extraClaims)
                .claim("roles", roles) // ✅ claim de roles
                .setSubject(userDetails.getUsername()) // Email del usuario
                .setIssuedAt(now)
                .setExpiration(expirationDate)
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extraer todas las claims del token JWT
     *
     * @param token Token JWT
     * @return Claims del token
     */
    private Claims extractAllClaims(String token) {
        try {
            return Jwts
                    .parserBuilder()
                    .setSigningKey(getSignInKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            log.error("❌ Error al parsear token JWT: {}", e.getMessage());
            throw e; // ✅ Re-throw para que el filtro lo maneje
        }
    }

    /**
     * Obtener la clave de firma HMAC para validar el JWT
     *
     * @return Clave de firma
     */
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Obtener el tiempo de expiración configurado
     * Útil para mostrar en logs o respuestas
     *
     * @return Tiempo de expiración en milisegundos
     */
    public long getExpirationTime() {
        return jwtExpiration;
    }

    /**
     * Obtener el tiempo de expiración en formato legible
     *
     * @return Tiempo de expiración en horas
     */
    public long getExpirationTimeInHours() {
        return jwtExpiration / (1000 * 60 * 60);
    }
}
