package com.example.instrumentos.mapper;

import com.example.instrumentos.dto.request.RegistroRequestDTO;
import com.example.instrumentos.dto.response.UsuarioResponseDTO;
import com.example.instrumentos.model.Usuario;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {

    public UsuarioResponseDTO toDTO(Usuario usuario) {
        return new UsuarioResponseDTO(
                usuario.getIdUsuario(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.isActivo());
    }

    public Usuario toEntity(RegistroRequestDTO dto) {
        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setEmail(dto.getEmail());
        // La contraseña y rol se asignan en el servicio
        return usuario;
    }
}