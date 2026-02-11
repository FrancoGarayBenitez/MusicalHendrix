package com.example.instrumentos.mapper;

import com.example.instrumentos.dto.request.InstrumentoRequestDTO;
import com.example.instrumentos.dto.response.CategoriaResponseDTO;
import com.example.instrumentos.dto.response.InstrumentoResponseDTO;
import com.example.instrumentos.model.CategoriaInstrumento;
import com.example.instrumentos.model.Instrumento;
import org.springframework.stereotype.Component;

@Component
public class InstrumentoMapper {

    public Instrumento toEntity(InstrumentoRequestDTO dto) {
        Instrumento instrumento = new Instrumento();
        instrumento.setDenominacion(dto.getDenominacion());
        instrumento.setMarca(dto.getMarca());
        instrumento.setStock(dto.getStock());
        instrumento.setDescripcion(dto.getDescripcion());
        instrumento.setImagen(dto.getImagen());

        // La categoría se asigna en el servicio
        CategoriaInstrumento categoria = new CategoriaInstrumento();
        categoria.setIdCategoriaInstrumento(dto.getCategoriaId());
        instrumento.setCategoriaInstrumento(categoria);

        return instrumento;
    }

    // Nuevo: recibe el precioActual calculado externamente (en el
    // servicio/controlador)
    public InstrumentoResponseDTO toDTO(Instrumento instrumento, Double precioActual) {
        CategoriaResponseDTO categoriaDTO = null;
        if (instrumento.getCategoriaInstrumento() != null) {
            categoriaDTO = new CategoriaResponseDTO(
                    instrumento.getCategoriaInstrumento().getIdCategoriaInstrumento(),
                    instrumento.getCategoriaInstrumento().getDenominacion());
        }

        return new InstrumentoResponseDTO(
                instrumento.getIdInstrumento(),
                instrumento.getDenominacion(),
                instrumento.getMarca(),
                instrumento.getStock(),
                instrumento.getDescripcion(),
                instrumento.getImagen(),
                precioActual,
                categoriaDTO);
    }
}