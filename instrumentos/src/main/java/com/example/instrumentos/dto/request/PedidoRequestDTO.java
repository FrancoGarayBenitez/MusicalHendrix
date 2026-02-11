package com.example.instrumentos.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PedidoRequestDTO {
    @NotNull(message = "El usuario es obligatorio")
    @Valid
    private UsuarioRequestDTO usuario;

    @NotEmpty(message = "El pedido debe tener al menos un detalle")
    @Valid
    private List<DetallePedidoRequestDTO> detalles;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsuarioRequestDTO {
        @NotNull(message = "El ID del usuario es obligatorio")
        private Long idUsuario;
    }
}