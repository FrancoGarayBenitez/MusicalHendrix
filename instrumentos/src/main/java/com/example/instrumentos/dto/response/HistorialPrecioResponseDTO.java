package com.example.instrumentos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistorialPrecioResponseDTO {
    private Long id;
    private Long instrumentoId;
    private String instrumentoDenominacion;
    private Double precio;
    private Date fechaVigencia;
    private boolean vigente;
}
