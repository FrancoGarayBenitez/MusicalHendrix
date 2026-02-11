package com.example.instrumentos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;

import com.example.instrumentos.model.EstadoPedido;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PedidoResponseDTO {
    private Long id;
    private Date fecha;
    private EstadoPedido estado;
    private Double total;
    private UsuarioResponseDTO usuario;
    private List<DetallePedidoDTO> detalles;
}
