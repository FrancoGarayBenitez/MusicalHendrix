package com.example.instrumentos.controller;

import com.example.instrumentos.dto.request.InstrumentoRequestDTO;
import com.example.instrumentos.dto.response.InstrumentoResponseDTO;
import com.example.instrumentos.mapper.InstrumentoMapper;
import com.example.instrumentos.model.HistorialPrecio;
import com.example.instrumentos.model.Instrumento;
import com.example.instrumentos.service.InstrumentoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/instrumentos")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class InstrumentoController {

    private final InstrumentoService instrumentoService;
    private final InstrumentoMapper instrumentoMapper;

    /**
     * Obtener todos los instrumentos (con filtro opcional por categoría)
     */
    @GetMapping
    public ResponseEntity<List<InstrumentoResponseDTO>> getAllInstrumentos(
            @RequestParam(required = false) Long idCategoria) {
        try {
            log.info("📋 Obteniendo instrumentos" +
                    (idCategoria != null ? " de categoría: " + idCategoria : ""));

            List<Instrumento> instrumentos = (idCategoria != null)
                    ? instrumentoService.findByCategoria(idCategoria)
                    : instrumentoService.findAll();

            List<InstrumentoResponseDTO> dtos = instrumentos.stream()
                    .map(instr -> {
                        Double precio;
                        try {
                            precio = instrumentoService.obtenerPrecioActual(instr);
                        } catch (IllegalStateException e) {
                            precio = 0.0;
                        }
                        return instrumentoMapper.toDTO(instr, precio);
                    })
                    .collect(Collectors.toList());

            log.info("✅ Se encontraron {} instrumento(s)", dtos.size());
            return ResponseEntity.ok(dtos);

        } catch (Exception e) {
            log.error("❌ Error al obtener instrumentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtener un instrumento por su ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getInstrumentoById(@PathVariable Long id) {
        try {
            log.info("📄 Consultando instrumento ID: {}", id);

            return instrumentoService.findById(id)
                    .map(instrumento -> {
                        Double precio;
                        try {
                            precio = instrumentoService.obtenerPrecioActual(instrumento);
                        } catch (IllegalStateException e) {
                            precio = 0.0;
                        }
                        InstrumentoResponseDTO dto = instrumentoMapper.toDTO(instrumento, precio);
                        log.info("✅ Instrumento {} encontrado", id);
                        return ResponseEntity.ok(dto);
                    })
                    .orElseGet(() -> {
                        log.warn("⚠️ Instrumento {} no encontrado", id);
                        return ResponseEntity.notFound().build();
                    });

        } catch (Exception e) {
            log.error("❌ Error al obtener instrumento {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener el instrumento"));
        }
    }

    /**
     * Crear un nuevo instrumento (solo admin)
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> createInstrumento(@Valid @RequestBody InstrumentoRequestDTO dto) {
        try {
            log.info("➕ Creando nuevo instrumento: {}", dto.getDenominacion());

            Instrumento saved = instrumentoService.save(dto);
            Instrumento savedWithHistorial = instrumentoService.findById(saved.getIdInstrumento())
                    .orElseThrow();

            Double precio;
            try {
                precio = instrumentoService.obtenerPrecioActual(savedWithHistorial);
            } catch (IllegalStateException e) {
                precio = 0.0;
            }

            InstrumentoResponseDTO response = instrumentoMapper.toDTO(savedWithHistorial, precio);

            log.info("✅ Instrumento creado con ID: {}", response.getIdInstrumento());
            return new ResponseEntity<>(response, HttpStatus.CREATED);

        } catch (IllegalArgumentException e) {
            log.error("❌ Error de validación: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al crear instrumento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al crear el instrumento"));
        }
    }

    /**
     * Actualizar un instrumento existente (solo admin)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateInstrumento(
            @PathVariable Long id,
            @Valid @RequestBody InstrumentoRequestDTO dto) {
        try {
            log.info("✏️ Actualizando instrumento ID: {}", id);

            Instrumento updatedInstrumento = instrumentoService.update(id, dto);

            Double precio;
            try {
                precio = instrumentoService.obtenerPrecioActual(updatedInstrumento);
            } catch (IllegalStateException e) {
                precio = 0.0;
            }

            InstrumentoResponseDTO response = instrumentoMapper.toDTO(updatedInstrumento, precio);

            log.info("✅ Instrumento {} actualizado correctamente", id);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("❌ Error de validación: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al actualizar instrumento {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al actualizar el instrumento"));
        }
    }

    /**
     * Eliminar un instrumento (solo admin)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteInstrumento(@PathVariable Long id) {
        try {
            log.info("🗑️ Eliminando instrumento ID: {}", id);
            instrumentoService.deleteById(id);
            log.info("✅ Instrumento {} eliminado correctamente", id);
            return ResponseEntity.noContent().build();

        } catch (IllegalArgumentException e) {
            log.error("❌ Error al eliminar: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al eliminar instrumento {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al eliminar el instrumento"));
        }
    }

    /**
     * Actualizar solo el precio de un instrumento (solo admin)
     */
    @PatchMapping("/{id}/precio")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updatePrecio(
            @PathVariable Long id,
            @RequestBody Map<String, Double> body) {
        try {
            Double nuevoPrecio = body.get("precio");

            if (nuevoPrecio == null || nuevoPrecio <= 0) {
                return ResponseEntity.badRequest()
                        .body(crearRespuestaError("Precio inválido"));
            }

            log.info("💰 Actualizando precio del instrumento {} a ${}", id, nuevoPrecio);

            HistorialPrecio historial = instrumentoService.actualizarPrecio(id, nuevoPrecio);

            Instrumento instrumentoActualizado = instrumentoService.findById(id)
                    .orElseThrow();

            Double precio;
            try {
                precio = instrumentoService.obtenerPrecioActual(instrumentoActualizado);
            } catch (IllegalStateException e) {
                precio = 0.0;
            }

            InstrumentoResponseDTO response = instrumentoMapper.toDTO(instrumentoActualizado, precio);

            log.info("✅ Precio actualizado. Historial ID: {}", historial.getIdHistorial());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("❌ Error al actualizar precio: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al actualizar precio del instrumento {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al actualizar el precio"));
        }
    }

    /**
     * Reponer stock de un instrumento (solo admin)
     */
    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateStock(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        try {
            Integer cantidad = body.get("cantidad");

            if (cantidad == null || cantidad <= 0) {
                return ResponseEntity.badRequest()
                        .body(crearRespuestaError("Cantidad inválida"));
            }

            log.info("📦 Reponiendo {} unidades al instrumento {}", cantidad, id);

            instrumentoService.reponerStock(id, cantidad);

            Instrumento instrumentoActualizado = instrumentoService.findById(id)
                    .orElseThrow();

            Double precio;
            try {
                precio = instrumentoService.obtenerPrecioActual(instrumentoActualizado);
            } catch (IllegalStateException e) {
                precio = 0.0;
            }

            InstrumentoResponseDTO response = instrumentoMapper.toDTO(instrumentoActualizado, precio);

            log.info("✅ Stock repuesto correctamente. Nuevo stock: {}", response.getStock());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("❌ Error al reponer stock: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(crearRespuestaError(e.getMessage()));

        } catch (Exception e) {
            log.error("❌ Error inesperado al reponer stock del instrumento {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error interno al reponer stock"));
        }
    }

    /**
     * Obtener instrumentos con bajo stock (solo admin)
     */
    @GetMapping("/bajo-stock")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<InstrumentoResponseDTO>> getInstrumentosBajoStock() {
        try {
            log.info("⚠️ Consultando instrumentos con bajo stock");

            List<Instrumento> instrumentos = instrumentoService.findInstrumentosConBajoStock();

            List<InstrumentoResponseDTO> response = instrumentos.stream()
                    .map(instr -> {
                        Double precio;
                        try {
                            precio = instrumentoService.obtenerPrecioActual(instr);
                        } catch (IllegalStateException e) {
                            precio = 0.0;
                        }
                        return instrumentoMapper.toDTO(instr, precio);
                    })
                    .collect(Collectors.toList());

            log.info("✅ Se encontraron {} instrumento(s) con bajo stock", response.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error al obtener instrumentos con bajo stock", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Método auxiliar para crear respuestas de error consistentes
     */
    private Map<String, String> crearRespuestaError(String mensaje) {
        Map<String, String> error = new HashMap<>();
        error.put("error", mensaje);
        return error;
    }
}