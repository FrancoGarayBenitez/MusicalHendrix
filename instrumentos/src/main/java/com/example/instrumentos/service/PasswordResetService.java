package com.example.instrumentos.service;

import com.example.instrumentos.model.PasswordResetToken;
import com.example.instrumentos.model.Usuario;
import com.example.instrumentos.repository.PasswordResetTokenRepository;
import com.example.instrumentos.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder; // ✅ AGREGADO
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder; // ✅ AGREGADO - Inyectar BCrypt

    private static final int TOKEN_EXPIRATION_MINUTES = 30;

    public void createPasswordResetToken(String email) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            log.warn("⚠️ Intento de recuperación para email no existente: {}", email);
            return; // ✅ No revelar si el email existe (seguridad)
        }

        Usuario usuario = usuarioOpt.get();

        // ✅ Elimina tokens anteriores del usuario
        tokenRepository.deleteByUsuario_Email(email);

        // ✅ Genera token único
        String token = generateSecureToken();

        // ✅ Crea nuevo token
        PasswordResetToken resetToken = new PasswordResetToken(token, usuario, TOKEN_EXPIRATION_MINUTES);
        tokenRepository.save(resetToken);

        // ✅ Envía el email
        emailService.sendPasswordResetEmail(usuario.getEmail(), usuario.getNombre(), token);

        log.info("✅ Token de recuperación creado para usuario: {}", email);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("❌ Token inválido"));

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("❌ El token ha expirado");
        }

        if (resetToken.getUsado()) {
            throw new IllegalArgumentException("❌ El token ya fue utilizado");
        }

        // ✅ USAR BCrypt en lugar de MD5
        String encryptedPassword = passwordEncoder.encode(newPassword);

        // ✅ Actualiza la contraseña del usuario en la base de datos
        Usuario usuario = resetToken.getUsuario();
        usuario.setContrasenia(encryptedPassword);
        usuarioRepository.save(usuario);

        // ✅ Marca el token como usado
        resetToken.setUsado(true);
        tokenRepository.save(resetToken);

        log.info("✅ Contraseña actualizada para usuario: {}", usuario.getEmail());
    }

    public boolean validatePasswordResetToken(String token) {
        Optional<PasswordResetToken> resetToken = tokenRepository.findByToken(token);
        return resetToken.isPresent() &&
                !resetToken.get().isExpired() &&
                !resetToken.get().getUsado();
    }

    private String generateSecureToken() {
        // ✅ Token único con UUID + timestamp
        return UUID.randomUUID().toString() + "-" + System.currentTimeMillis();
    }

    // ❌ ELIMINAR MÉTODO encryptPassword(String) - Ya no se usa
    // El passwordEncoder (BCrypt) se usa directamente en resetPassword()

    @Scheduled(fixedRate = 3600000) // ✅ Cada hora
    public void cleanExpiredTokens() {
        tokenRepository.deleteByFechaExpiracionBefore(new Date());
        log.info("🧹 Tokens expirados eliminados");
    }
}