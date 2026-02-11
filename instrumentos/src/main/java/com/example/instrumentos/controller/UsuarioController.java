package com.example.instrumentos.controller;

import com.example.instrumentos.dto.request.LoginRequest;
import com.example.instrumentos.dto.response.LoginResponse;
import com.example.instrumentos.dto.response.UsuarioResponseDTO;
import com.example.instrumentos.dto.request.RegistroRequestDTO;
import com.example.instrumentos.dto.request.UsuarioAdminUpdateRequestDTO;
import com.example.instrumentos.model.Usuario;
import com.example.instrumentos.service.JwtService; // ✅ AGREGADO
import com.example.instrumentos.service.UsuarioService;
import com.example.instrumentos.mapper.UsuarioMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioMapper usuarioMapper;
    private final JwtService jwtService; // ✅ AGREGADO

    /**
     * Endpoint de login - PÚBLICO
     * Genera un JWT si las credenciales son correctas
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            log.info("📧 Intento de login para usuario: {}", loginRequest.getEmail());

            // 1️⃣ Validar credenciales (devuelve Usuario)
            Usuario usuario = usuarioService.autenticarUsuario(
                    loginRequest.getEmail(),
                    loginRequest.getClave() // ✅ CORREGIDO: Pasar email y password por separado
            );

            // 2️⃣ Cargar UserDetails para generar JWT
            UserDetails userDetails = usuarioService.loadUserByUsername(usuario.getEmail());

            // 3️⃣ Generar JWT
            String token = jwtService.generateToken(userDetails);

            // 4️⃣ Construir respuesta
            LoginResponse response = LoginResponse.builder()
                    .id(usuario.getIdUsuario())
                    .email(usuario.getEmail())
                    .rol(usuario.getRol())
                    .token(token)
                    .success(true)
                    .message("Inicio de sesión exitoso")
                    .activo(usuario.isActivo())
                    .build();

            log.info("✅ Login exitoso para: {} - Rol: {}", usuario.getEmail(), usuario.getRol());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Credenciales inválidas: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(LoginResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());

        } catch (IllegalStateException e) {
            log.warn("⚠️ Usuario inactivo: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(LoginResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .activo(false)
                            .build());

        } catch (Exception e) {
            log.error("❌ Error inesperado en login: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(LoginResponse.builder()
                            .success(false)
                            .message("Error al procesar la solicitud de login")
                            .build());
        }
    }

    /**
     * Endpoint de registro - PÚBLICO
     * Crea un nuevo usuario con rol USER por defecto
     */
    @PostMapping("/registro")
    public ResponseEntity<?> registro(@Valid @RequestBody RegistroRequestDTO registroRequest) {
        try {
            log.info("📝 Intento de registro para usuario: {}", registroRequest.getEmail());

            Usuario nuevoUsuario = usuarioService.registrarUsuario(registroRequest);
            UsuarioResponseDTO usuarioDTO = usuarioMapper.toDTO(nuevoUsuario);

            Map<String, Object> response = new HashMap<>();
            response.put("id", usuarioDTO.getId());
            response.put("email", usuarioDTO.getEmail());
            response.put("nombre", usuarioDTO.getNombre());
            response.put("apellido", usuarioDTO.getApellido());
            response.put("rol", usuarioDTO.getRol());
            response.put("message", "Usuario registrado exitosamente");

            log.info("✅ Usuario registrado exitosamente: {}", nuevoUsuario.getEmail());
            return new ResponseEntity<>(response, HttpStatus.CREATED);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Error de validación en registro: {}", e.getMessage());
            return ResponseEntity
                    .badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error en registro: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al procesar la solicitud de registro"));
        }
    }

    /**
     * Obtener información del usuario autenticado actual
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("👤 Usuario actual solicitado: {}", email);

            return usuarioService.findByEmail(email)
                    .map(usuario -> {
                        UsuarioResponseDTO response = usuarioMapper.toDTO(usuario);
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        log.warn("⚠️ Usuario autenticado no encontrado en BD: {}", email);
                        return ResponseEntity.notFound().build();
                    });

        } catch (Exception e) {
            log.error("❌ Error al obtener usuario actual: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener información del usuario"));
        }
    }

    /**
     * Obtener todos los usuarios (solo ADMIN)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsuarios() {
        try {
            log.info("📋 Listando todos los usuarios (Admin)");

            List<UsuarioResponseDTO> usuarios = usuarioService.findAll()
                    .stream()
                    .map(usuarioMapper::toDTO)
                    .collect(Collectors.toList());

            log.info("✅ Se encontraron {} usuario(s)", usuarios.size());
            return ResponseEntity.ok(usuarios);

        } catch (Exception e) {
            log.error("❌ Error al obtener usuarios: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener usuarios"));
        }
    }

    /**
     * Obtener usuario por ID (solo ADMIN)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUsuarioById(@PathVariable Long id) {
        try {
            log.info("🔍 Buscando usuario ID: {}", id);

            return usuarioService.findById(id)
                    .map(usuario -> {
                        UsuarioResponseDTO response = usuarioMapper.toDTO(usuario);
                        log.info("✅ Usuario encontrado: {}", usuario.getEmail());
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        log.warn("⚠️ Usuario no encontrado con ID: {}", id);
                        return ResponseEntity.notFound().build();
                    });

        } catch (Exception e) {
            log.error("❌ Error al obtener usuario {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener el usuario"));
        }
    }

    /**
     * Actualizar un usuario existente (solo ADMIN)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUsuario(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioAdminUpdateRequestDTO updateRequest) {
        try {
            log.info("✏️ Actualizando usuario ID: {}", id);

            // Validar que el DTO tenga los campos requeridos
            if (updateRequest.getRol() == null) {
                return ResponseEntity.badRequest()
                        .body(crearRespuestaError("El rol es obligatorio"));
            }

            if (updateRequest.getActivo() == null) {
                return ResponseEntity.badRequest()
                        .body(crearRespuestaError("El estado activo es obligatorio"));
            }

            UsuarioResponseDTO actualizado = usuarioService.actualizarUsuarioAdmin(id, updateRequest);

            log.info("✅ Usuario {} actualizado correctamente", id);
            return ResponseEntity.ok(actualizado);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Error al actualizar usuario {}: {}", id, e.getMessage());
            return ResponseEntity
                    .badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error al actualizar usuario {}: {}", id, e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al actualizar el usuario"));
        }
    }

    /**
     * Deshabilitar usuario (solo ADMIN)
     * Borrado lógico - cambia activo a false
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUsuario(@PathVariable Long id) {
        try {
            log.info("🚫 Deshabilitando usuario ID: {}", id);

            usuarioService.deshabilitarUsuario(id);

            log.info("✅ Usuario {} deshabilitado correctamente", id);
            return ResponseEntity.noContent().build();

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Error al deshabilitar usuario {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();

        } catch (Exception e) {
            log.error("❌ Error al deshabilitar usuario {}: {}", id, e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al deshabilitar el usuario"));
        }
    }

    /**
     * Verificar si un email ya está registrado
     */
    @GetMapping("/verificar-email")
    public ResponseEntity<Map<String, Boolean>> verificarEmail(@RequestParam String email) {
        try {
            boolean existe = usuarioService.findByEmail(email).isPresent();

            Map<String, Boolean> response = new HashMap<>();
            response.put("existe", existe);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error al verificar email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Método auxiliar para crear respuestas de error consistentes
     */
    private Map<String, String> crearRespuestaError(String mensaje) {
        Map<String, String> error = new HashMap<>();
        error.put("error", mensaje);
        return error;
    }
}