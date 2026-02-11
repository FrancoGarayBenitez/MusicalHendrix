package com.example.instrumentos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoStatusResponseDTO {
    private String preferenceId;
    private String estado;
    private String mensaje;
    private Date timestamp;

    // ✅ Constructor de conveniencia
    public PagoStatusResponseDTO(String preferenceId, String estado, String mensaje) {
        this.preferenceId = preferenceId;
        this.estado = estado;
        this.mensaje = mensaje;
        this.timestamp = new Date();
    }
}