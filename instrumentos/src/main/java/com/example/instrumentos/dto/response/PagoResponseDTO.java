package com.example.instrumentos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagoResponseDTO {
    private Long idPago;
    private Long idPedido;
    private String mercadoPagoPreferenceId;
    private String mercadoPagoPaymentId;
    private String estado;
    private Date fechaCreacion;
    private Date fechaActualizacion;
    private Double monto;
    private String descripcion;

    // Helpers para el frontend
    private boolean aprobado;
    private boolean pendiente;
    private boolean rechazado;
}