package com.example.instrumentos.service;

import com.example.instrumentos.dto.request.LoginRequest;
import com.example.instrumentos.dto.response.LoginResponse;
import com.example.instrumentos.dto.request.RegistroRequestDTO;
import com.example.instrumentos.model.Rol;
import com.example.instrumentos.model.Usuario;
import com.example.instrumentos.repository.RolRepository;
import com.example.instrumentos.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    // Autenticar usuario
    public LoginResponse autenticarUsuario(LoginRequest loginRequest) {
        // Buscar usuario por email
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(loginRequest.getEmail());

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            // Verificar clave encriptada
            String claveEncriptada = encriptarClave(loginRequest.getClave());

            if (claveEncriptada.equals(usuario.getContrasenia())) {
                return new LoginResponse(
                        usuario.getIdUsuario(),
                        usuario.getEmail(),
                        usuario.getRol().getDefinicion(),
                        null, // No hay token por ahora
                        true,
                        "Inicio de sesión exitoso"
                );
            }
        }

        // Usuario y/o clave incorrectos
        return new LoginResponse(
                null,
                null,
                null,
                null,
                false,
                "Usuario y/o clave incorrectos"
        );
    }

    // Registrar nuevo usuario
    public Usuario registrarUsuario(RegistroRequestDTO registroRequest) {
        // Verificar si el usuario ya existe
        if (usuarioRepository.existsByEmail(registroRequest.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        // Obtener el rol
        String rolNombre = registroRequest.getRol();
        if (rolNombre == null || rolNombre.isEmpty()) {
            rolNombre = "Visor"; // Rol por defecto
        }

        // Crear variable final para usar en lambda
        final String rolFinal = rolNombre;
        Rol rol = rolRepository.findByDefinicion(rolFinal)
                .orElseThrow(() -> new IllegalArgumentException("Rol no válido: " + rolFinal));

        // Encriptar la clave
        String claveEncriptada = encriptarClave(registroRequest.getClave());

        // Crear el nuevo usuario
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setEmail(registroRequest.getEmail());
        nuevoUsuario.setNombre(registroRequest.getNombre());
        nuevoUsuario.setApellido(registroRequest.getApellido());
        nuevoUsuario.setContrasenia(claveEncriptada);
        nuevoUsuario.setRol(rol);

        return usuarioRepository.save(nuevoUsuario);
    }

    // Encriptar clave con MD5
    private String encriptarClave(String clave) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(clave.getBytes());
            BigInteger number = new BigInteger(1, messageDigest);
            String hashtext = number.toString(16);

            while (hashtext.length() < 32) {
                hashtext = "0" + hashtext;
            }

            return hashtext;
        } catch (NoSuchAlgorithmException e) {
            log.error("Error al encriptar clave: {}", e.getMessage());
            throw new RuntimeException("Error al encriptar clave", e);
        }
    }

    // Obtener todos los usuarios
    public List<Usuario> findAll() {
        return usuarioRepository.findAll();
    }

    // Buscar usuario por ID
    public Optional<Usuario> findById(Long id) {
        return usuarioRepository.findById(id);
    }

    // Actualizar usuario
    public Usuario actualizarUsuario(Usuario usuario) {
        // Verificar que el usuario existe
        Usuario existente = usuarioRepository.findById(usuario.getIdUsuario())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // Actualizar campos
        existente.setNombre(usuario.getNombre());
        existente.setApellido(usuario.getApellido());
        existente.setEmail(usuario.getEmail());

        // Si se proporciona un nuevo rol
        if (usuario.getRol() != null && usuario.getRol().getIdRol() != null) {
            Rol nuevoRol = rolRepository.findById(usuario.getRol().getIdRol())
                    .orElseThrow(() -> new IllegalArgumentException("Rol no válido"));
            existente.setRol(nuevoRol);
        }

        return usuarioRepository.save(existente);
    }

    // Eliminar usuario por ID
    public void deleteById(Long id) {
        usuarioRepository.deleteById(id);
    }

    // Inicializar usuarios (llamado desde DataInitializer)
    public void inicializarUsuarios() {
        // La inicialización ahora se hace en DataInitializer
        log.info("Inicialización de usuarios se maneja en DataInitializer");
    }
}