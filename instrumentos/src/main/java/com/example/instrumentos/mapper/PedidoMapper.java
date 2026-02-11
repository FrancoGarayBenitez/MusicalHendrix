package com.example.instrumentos.mapper;

import com.example.instrumentos.dto.request.DetallePedidoRequestDTO;
import com.example.instrumentos.dto.response.DetallePedidoDTO;
import com.example.instrumentos.dto.response.InstrumentoResponseDTO;
import com.example.instrumentos.dto.response.PedidoResponseDTO;
import com.example.instrumentos.model.DetallePedido;
import com.example.instrumentos.model.Instrumento;
import com.example.instrumentos.model.Pedido;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PedidoMapper {

    private final UsuarioMapper usuarioMapper;
    private final InstrumentoMapper instrumentoMapper;

    /**
     * Convierte un Pedido (entidad) a PedidoResponseDTO
     */
    public PedidoResponseDTO toDTO(Pedido pedido) {
        List<DetallePedidoDTO> detallesDTO = pedido.getDetalles().stream()
                .map(this::toDetallePedidoDTO)
                .collect(Collectors.toList());

        return new PedidoResponseDTO(
                pedido.getIdPedido(),
                pedido.getFecha(),
                pedido.getEstado(),
                pedido.getTotalPedido(),
                usuarioMapper.toDTO(pedido.getUsuario()),
                detallesDTO);
    }

    /**
     * Convierte una lista de DetallePedidoRequestDTO a entidades DetallePedido
     */
    public List<DetallePedido> toDetallePedidoEntities(List<DetallePedidoRequestDTO> detallesDTO) {
        return detallesDTO.stream()
                .map(this::toDetallePedidoEntity)
                .collect(Collectors.toList());
    }

    /**
     * Convierte un DetallePedidoRequestDTO a entidad DetallePedido
     */
    private DetallePedido toDetallePedidoEntity(DetallePedidoRequestDTO dto) {
        DetallePedido detalle = new DetallePedido();
        detalle.setCantidad(dto.getCantidad());

        // Crear instrumento con solo el ID (se carga completo en el servicio)
        Instrumento instrumento = new Instrumento();
        instrumento.setIdInstrumento(dto.getInstrumentoId());
        detalle.setInstrumento(instrumento);

        // El precio se asignará en PedidoService
        return detalle;
    }

    /**
     * Convierte un DetallePedido (entidad) a DetallePedidoDTO
     */
    private DetallePedidoDTO toDetallePedidoDTO(DetallePedido detalle) {
        // Usar SIEMPRE el precio guardado en el detalle (precio al momento del pedido)
        Double precioUnitario = detalle.getPrecioUnitario();
        if (precioUnitario == null) {
            precioUnitario = 0.0; // fallback para pedidos antiguos sin precio persistido
        }

        // Construir el DTO del instrumento usando ese precio
        InstrumentoResponseDTO instrumentoDTO = instrumentoMapper.toDTO(detalle.getInstrumento(), precioUnitario);

        Double subtotal = precioUnitario * detalle.getCantidad();

        return new DetallePedidoDTO(
                detalle.getIdDetallePedido(),
                instrumentoDTO,
                detalle.getCantidad(),
                precioUnitario,
                subtotal);
    }
}
