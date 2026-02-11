package com.example.instrumentos.dto.request;

import com.example.instrumentos.model.Rol;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioAdminUpdateRequestDTO {

    @NotNull(message = "El rol es obligatorio")
    private Rol rol;

    @NotNull(message = "El estado activo es obligatorio")
    private Boolean activo;

    /**
     * Nueva contraseña (opcional)
     * Si se proporciona, debe tener al menos 6 caracteres
     */
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String clave;
}
