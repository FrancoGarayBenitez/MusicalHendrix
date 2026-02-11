package com.example.instrumentos.service;

import com.example.instrumentos.dto.request.RegistroRequestDTO;
import com.example.instrumentos.dto.request.UsuarioAdminUpdateRequestDTO;
import com.example.instrumentos.dto.response.UsuarioResponseDTO;
import com.example.instrumentos.mapper.UsuarioMapper;
import com.example.instrumentos.model.Rol;
import com.example.instrumentos.model.Usuario;
import com.example.instrumentos.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UsuarioService implements org.springframework.security.core.userdetails.UserDetailsService {

    private final com.example.instrumentos.repository.UsuarioRepository usuarioRepository;

    // ✅ Inyección directa (sin @Lazy)
    private final PasswordEncoder passwordEncoder;

    private final com.example.instrumentos.mapper.UsuarioMapper usuarioMapper;

    /**
     * Implementación de UserDetailsService para Spring Security
     * Carga el usuario por email (username)
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("🔍 Buscando usuario por email: {}", email);

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("❌ Usuario no encontrado: {}", email);
                    return new UsernameNotFoundException("Usuario no encontrado: " + email);
                });

        log.info("✅ Usuario encontrado: {} - Rol: {}", usuario.getEmail(), usuario.getRol());

        // Convertir Usuario a UserDetails de Spring Security
        return User.builder()
                .username(usuario.getEmail())
                .password(usuario.getContrasenia())
                .authorities(Collections.singleton(
                        new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name())))
                .accountExpired(false)
                .accountLocked(!usuario.isActivo())
                .credentialsExpired(false)
                .disabled(!usuario.isActivo())
                .build();
    }

    /**
     * ✅ MÉTODO SIMPLIFICADO: Solo valida credenciales, NO genera JWT
     * El JWT se genera en el AuthController
     */
    public Usuario autenticarUsuario(String email, String password) {
        log.info("🔐 Validando credenciales para usuario: {}", email);

        // Buscar usuario por email
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("⚠️ Usuario no encontrado: {}", email);
                    return new IllegalArgumentException("Usuario y/o contraseña incorrectos");
                });

        // Verificar si el usuario está activo
        if (!usuario.isActivo()) {
            log.warn("⚠️ Usuario inactivo: {}", email);
            throw new IllegalStateException("El usuario está deshabilitado. Contacte al administrador.");
        }

        // Verificar contraseña usando BCrypt
        if (!passwordEncoder.matches(password, usuario.getContrasenia())) {
            log.warn("⚠️ Contraseña incorrecta para usuario: {}", email);
            throw new IllegalArgumentException("Usuario y/o contraseña incorrectos");
        }

        log.info("✅ Credenciales válidas para usuario: {} - Rol: {}", email, usuario.getRol());

        return usuario; // ✅ Devuelve el usuario validado (sin generar JWT aquí)
    }

    /**
     * Registrar nuevo usuario
     */
    public Usuario registrarUsuario(RegistroRequestDTO registroRequest) {
        log.info("📝 Registrando nuevo usuario: {}", registroRequest.getEmail());

        // Verificar si el usuario ya existe
        if (usuarioRepository.existsByEmail(registroRequest.getEmail())) {
            log.warn("⚠️ Email ya registrado: {}", registroRequest.getEmail());
            throw new IllegalArgumentException("El email ya está registrado: " + registroRequest.getEmail());
        }

        // Determinar el rol (por defecto USER)
        Rol rol = registroRequest.getRol() != null ? registroRequest.getRol() : Rol.USER;

        // Encriptar la contraseña con BCrypt
        String claveEncriptada = passwordEncoder.encode(registroRequest.getClave());

        // Crear el nuevo usuario
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setEmail(registroRequest.getEmail());
        nuevoUsuario.setNombre(registroRequest.getNombre());
        nuevoUsuario.setApellido(registroRequest.getApellido());
        nuevoUsuario.setContrasenia(claveEncriptada);
        nuevoUsuario.setRol(rol);
        nuevoUsuario.setActivo(true);

        Usuario guardado = usuarioRepository.save(nuevoUsuario);
        log.info("✅ Usuario registrado exitosamente: {} con rol: {}", guardado.getEmail(), rol);

        return guardado;
    }

    /**
     * Obtener todos los usuarios
     */
    public List<Usuario> findAll() {
        return usuarioRepository.findAll();
    }

    /**
     * Buscar usuario por ID
     */
    public Optional<Usuario> findById(Long id) {
        return usuarioRepository.findById(id);
    }

    /**
     * Buscar usuario por email
     */
    public Optional<Usuario> findByEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }

    /**
     * Actualizar usuario (campos básicos)
     */
    public Usuario actualizarUsuario(Usuario usuario) {
        Usuario existente = usuarioRepository.findById(usuario.getIdUsuario())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        existente.setNombre(usuario.getNombre());
        existente.setApellido(usuario.getApellido());
        existente.setEmail(usuario.getEmail());

        // Si se cambió la contraseña, encriptarla
        if (usuario.getContrasenia() != null && !usuario.getContrasenia().isEmpty()) {
            existente.setContrasenia(passwordEncoder.encode(usuario.getContrasenia()));
        }

        return usuarioRepository.save(existente);
    }

    /**
     * Actualizar usuario desde panel de admin
     */
    public UsuarioResponseDTO actualizarUsuarioAdmin(Long id, UsuarioAdminUpdateRequestDTO updateRequest) {
        log.info("✏️ Actualizando usuario ID: {}", id);

        Usuario existente = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

        // Actualizar rol y estado
        existente.setRol(updateRequest.getRol());
        existente.setActivo(updateRequest.getActivo());

        // ✅ Si se proporcionó nueva contraseña, actualizarla
        if (updateRequest.getClave() != null && !updateRequest.getClave().isEmpty()) {
            existente.setContrasenia(passwordEncoder.encode(updateRequest.getClave()));
            log.info("🔐 Contraseña actualizada para usuario ID: {}", id);
        }

        Usuario actualizado = usuarioRepository.save(existente);

        log.info("✅ Usuario actualizado - ID: {}, Rol: {}, Activo: {}",
                id, actualizado.getRol(), actualizado.isActivo());

        return usuarioMapper.toDTO(actualizado);
    }

    /**
     * Deshabilitar usuario (borrado lógico)
     */
    public void deshabilitarUsuario(Long id) {
        log.info("🚫 Deshabilitando usuario ID: {}", id);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

        usuario.setActivo(false);
        usuarioRepository.save(usuario);

        log.info("✅ Usuario deshabilitado: {}", usuario.getEmail());
    }

    /**
     * Eliminar usuario físicamente
     */
    public void deleteById(Long id) {
        log.info("🗑️ Eliminando usuario físicamente ID: {}", id);

        if (!usuarioRepository.existsById(id)) {
            throw new IllegalArgumentException("Usuario no encontrado con ID: " + id);
        }

        usuarioRepository.deleteById(id);
        log.info("✅ Usuario eliminado con ID: {}", id);
    }

    /**
     * Validar credenciales (método auxiliar)
     */
    public boolean validarCredenciales(String email, String password) {
        Optional<Usuario> usuarioOpt = findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            return false;
        }

        return passwordEncoder.matches(password, usuarioOpt.get().getContrasenia());
    }
}