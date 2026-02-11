package com.example.instrumentos.mapper;

import com.example.instrumentos.dto.response.PagoResponseDTO;
import com.example.instrumentos.model.Pago;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PagoMapper {

    /**
     * Convierte una entidad Pago a PagoResponseDTO
     */
    public PagoResponseDTO toDTO(Pago pago) {
        if (pago == null) {
            return null;
        }

        PagoResponseDTO dto = new PagoResponseDTO();
        dto.setIdPago(pago.getIdPago());
        dto.setIdPedido(pago.getPedido() != null ? pago.getPedido().getIdPedido() : null);
        dto.setMercadoPagoPreferenceId(pago.getMercadoPagoPreferenceId());
        dto.setMercadoPagoPaymentId(pago.getMercadoPagoPaymentId());
        dto.setEstado(pago.getEstado());
        dto.setFechaCreacion(pago.getFechaCreacion());
        dto.setFechaActualizacion(pago.getFechaActualizacion());
        dto.setMonto(pago.getMonto());
        dto.setDescripcion(pago.getDescripcion());

        // Agregar helpers de estado
        dto.setAprobado(pago.isAprobado());
        dto.setPendiente(pago.isPendiente());
        dto.setRechazado(pago.isRechazado());

        return dto;
    }

    /**
     * Convierte una lista de Pagos a lista de DTOs
     */
    public List<PagoResponseDTO> toDTOList(List<Pago> pagos) {
        if (pagos == null || pagos.isEmpty()) {
            return List.of();
        }

        return pagos.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}