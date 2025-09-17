package com.example.instrumentos.controller;

import com.example.instrumentos.dto.request.LoginRequest;
import com.example.instrumentos.dto.response.LoginResponse;
import com.example.instrumentos.dto.request.RegistroRequestDTO;
import com.example.instrumentos.model.Usuario;
import com.example.instrumentos.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
@Slf4j
public class UsuarioController {

    private final UsuarioService usuarioService;

    //login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            log.info("Intento de login para usuario: {}", loginRequest.getEmail());

            LoginResponse response = usuarioService.autenticarUsuario(loginRequest);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (Exception e) {
            log.error("Error en login: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error al procesar la solicitud de login");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    //registro de usuarios
    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody RegistroRequestDTO registroRequest) {
        try {
            log.info("Intento de registro para usuario: {}", registroRequest.getEmail());

            Usuario nuevoUsuario = usuarioService.registrarUsuario(registroRequest);

            //respuesta sin incluir la contraseña
            Map<String, Object> response = new HashMap<>();
            response.put("id", nuevoUsuario.getIdUsuario());
            response.put("email", nuevoUsuario.getEmail());
            response.put("nombre", nuevoUsuario.getNombre());
            response.put("apellido", nuevoUsuario.getApellido());
            response.put("rol", nuevoUsuario.getRol().getDefinicion());
            response.put("message", "Usuario registrado exitosamente");

            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            log.warn("Error de validación en registro: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error en registro: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error al procesar la solicitud de registro");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    //obtener todos los usuarios (solo admin)
    @GetMapping
    public ResponseEntity<List<Usuario>> getAllUsuarios() {
        return ResponseEntity.ok(usuarioService.findAll());
    }

    //obtener usuario por ID (solo admin)
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> getUsuarioById(@PathVariable Long id) {
        return usuarioService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    //actualizar un usuario existente (solo admin)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUsuario(@PathVariable Long id, @RequestBody Usuario usuario) {
        try {
            usuario.setIdUsuario(id);
            Usuario actualizado = usuarioService.actualizarUsuario(usuario);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    //eliminar usuario (solo admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUsuario(@PathVariable Long id) {
        return usuarioService.findById(id)
                .map(usuario -> {
                    usuarioService.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}