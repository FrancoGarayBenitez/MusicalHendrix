package com.example.instrumentos.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistorialPrecioRequestDTO {

    @NotNull(message = "El ID del instrumento es obligatorio")
    private Long instrumentoId;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
    private Double precio;

    private Date fechaVigencia; // Opcional, si no se envía se usa la fecha actual
}
