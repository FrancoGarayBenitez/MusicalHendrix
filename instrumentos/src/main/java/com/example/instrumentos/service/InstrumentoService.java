package com.example.instrumentos.service;

import com.example.instrumentos.dto.request.InstrumentoRequestDTO;
import com.example.instrumentos.mapper.InstrumentoMapper;
import com.example.instrumentos.model.CategoriaInstrumento;
import com.example.instrumentos.model.HistorialPrecio;
import com.example.instrumentos.model.Instrumento;
import com.example.instrumentos.repository.CategoriaInstrumentoRepository;
import com.example.instrumentos.repository.HistorialPrecioRepository;
import com.example.instrumentos.repository.InstrumentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InstrumentoService {

    private final InstrumentoRepository instrumentoRepository;
    private final CategoriaInstrumentoRepository categoriaRepository;
    private final HistorialPrecioRepository historialPrecioRepository;
    private final InstrumentoMapper instrumentoMapper;

    public List<Instrumento> findAll() {
        return instrumentoRepository.findAll();
    }

    public List<Instrumento> findByCategoria(Long idCategoria) {
        return instrumentoRepository.findByCategoriaInstrumento_IdCategoriaInstrumento(idCategoria);
    }

    public Optional<Instrumento> findById(Long id) {
        return instrumentoRepository.findByIdWithHistorialPrecios(id);
    }

    public Instrumento save(Instrumento instrumento) {
        return instrumentoRepository.save(instrumento);
    }

    public Instrumento save(InstrumentoRequestDTO instrumentoRequestDTO) {
        log.info("Guardando instrumento desde DTO: {}", instrumentoRequestDTO.getDenominacion());

        // Mapear DTO a entidad
        Instrumento instrumento = instrumentoMapper.toEntity(instrumentoRequestDTO);

        // Buscar y asignar la categoría completa
        CategoriaInstrumento categoria = categoriaRepository.findById(instrumentoRequestDTO.getCategoriaId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Categoría no encontrada con ID: " + instrumentoRequestDTO.getCategoriaId()));
        instrumento.setCategoriaInstrumento(categoria);

        // Guardar el instrumento para obtener su ID
        Instrumento savedInstrumento = instrumentoRepository.save(instrumento);

        // Crear y guardar el historial de precio usando el precio del DTO
        log.info("Creando historial para el precio: {}", instrumentoRequestDTO.getPrecioActual());
        HistorialPrecio historial = new HistorialPrecio(savedInstrumento,
                instrumentoRequestDTO.getPrecioActual());
        historialPrecioRepository.save(historial);

        return savedInstrumento;
    }

    public Instrumento update(Long id, InstrumentoRequestDTO dto) {
        log.info("Actualizando instrumento {}", id);

        // 1. Buscar el instrumento existente
        Instrumento instrumento = instrumentoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Instrumento no encontrado con ID: " + id));

        // 2. Obtener precio actual antes de actualizar
        Double precioActualAnterior = obtenerPrecioActual(instrumento);

        // 3. Actualizar los campos desde el DTO
        instrumento.setDenominacion(dto.getDenominacion());
        instrumento.setMarca(dto.getMarca());
        instrumento.setStock(dto.getStock());
        instrumento.setDescripcion(dto.getDescripcion());
        instrumento.setImagen(dto.getImagen());

        // 4. Actualizar la categoría
        CategoriaInstrumento categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Categoría no encontrada con ID: " + dto.getCategoriaId()));
        instrumento.setCategoriaInstrumento(categoria);

        // 5. Guardar la entidad actualizada
        instrumentoRepository.save(instrumento);

        // 6. Manejar la actualización del precio (si cambió)
        if (dto.getPrecioActual() != null &&
                Math.abs(precioActualAnterior - dto.getPrecioActual()) > 0.01) {
            log.info("Precio cambió de {} a {}", precioActualAnterior, dto.getPrecioActual());
            actualizarPrecio(id, dto.getPrecioActual());
        }

        // 7. Devolver la entidad actualizada y con el historial cargado
        return findById(id).orElseThrow();
    }

    public void deleteById(Long id) {
        // Verificar que el instrumento existe
        Instrumento instrumento = instrumentoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Instrumento no encontrado"));

        // Verificar que no tenga pedidos asociados
        if (instrumento.getDetallesPedido() != null && !instrumento.getDetallesPedido().isEmpty()) {
            throw new IllegalArgumentException("No se puede eliminar un instrumento con pedidos asociados");
        }

        instrumentoRepository.deleteById(id);
        log.info("Instrumento {} eliminado", id);
    }

    /**
     * Obtener el precio actual de un instrumento desde el historial
     */
    public Double obtenerPrecioActual(Long instrumentoId) {
        Instrumento instrumento = instrumentoRepository.findById(instrumentoId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Instrumento no encontrado con ID: " + instrumentoId));

        return obtenerPrecioActual(instrumento);
    }

    /**
     * Obtener el precio actual de un instrumento (sobrecarga)
     */
    public Double obtenerPrecioActual(Instrumento instrumento) {
        HistorialPrecio historialActual = historialPrecioRepository
                .findFirstByInstrumentoOrderByFechaVigenciaDesc(instrumento)
                .orElse(null);

        if (historialActual != null) {
            return historialActual.getPrecio();
        }

        throw new IllegalStateException(
                "No se encontró precio para el instrumento: " + instrumento.getDenominacion() +
                        " (ID: " + instrumento.getIdInstrumento() + ")");
    }

    /**
     * Actualizar el precio de un instrumento (crea nuevo registro en historial)
     */
    public HistorialPrecio actualizarPrecio(Long idInstrumento, Double nuevoPrecio) {
        log.info("💰 Actualizando precio del instrumento {} a ${}", idInstrumento, nuevoPrecio);

        Instrumento instrumento = instrumentoRepository.findById(idInstrumento)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Instrumento no encontrado con ID: " + idInstrumento));

        // Verificar si el precio realmente cambió
        try {
            Double precioActual = obtenerPrecioActual(instrumento);
            if (Math.abs(precioActual - nuevoPrecio) < 0.01) {
                log.info("⚠️ El precio no cambió, no se crea historial");
                return historialPrecioRepository
                        .findFirstByInstrumentoOrderByFechaVigenciaDesc(instrumento)
                        .orElse(null);
            }
            log.info("Precio anterior: ${} → Nuevo precio: ${}", precioActual, nuevoPrecio);
        } catch (IllegalStateException e) {
            log.info("📝 Primer precio del instrumento");
        }

        // Crear nuevo registro en el historial de precios
        HistorialPrecio nuevoHistorial = new HistorialPrecio(instrumento, nuevoPrecio);
        nuevoHistorial = historialPrecioRepository.save(nuevoHistorial);

        log.info("✅ Precio actualizado. Historial ID: {}", nuevoHistorial.getIdHistorial());
        return nuevoHistorial;
    }

    /**
     * Actualizar stock (descontar) después de una venta
     */
    public void actualizarStock(Long idInstrumento, Integer cantidadVendida) {
        log.info("📦 Descontando {} unidades del instrumento {}", cantidadVendida, idInstrumento);

        Instrumento instrumento = instrumentoRepository.findById(idInstrumento)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Instrumento no encontrado con ID: " + idInstrumento));

        // Usar el método helper de la entidad
        instrumento.descontarStock(cantidadVendida);
        instrumentoRepository.save(instrumento);

        log.info("✅ Stock actualizado: {} unidades restantes", instrumento.getStock());
    }

    /**
     * Reponer stock (para cancelaciones)
     */
    public void reponerStock(Long idInstrumento, Integer cantidadReponer) {
        log.info("📦 Reponiendo {} unidades del instrumento {}", cantidadReponer, idInstrumento);

        Instrumento instrumento = instrumentoRepository.findById(idInstrumento)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Instrumento no encontrado con ID: " + idInstrumento));

        // Usar el método helper de la entidad
        instrumento.reponerStock(cantidadReponer);
        instrumentoRepository.save(instrumento);

        log.info("✅ Stock repuesto: {} unidades disponibles", instrumento.getStock());
    }

    /**
     * Verificar disponibilidad de stock
     */
    public boolean verificarStock(Long idInstrumento, Integer cantidad) {
        Instrumento instrumento = instrumentoRepository.findById(idInstrumento)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Instrumento no encontrado con ID: " + idInstrumento));

        return instrumento.tieneStockDisponible(cantidad);
    }

    /**
     * Obtener instrumentos con bajo stock (menos de 5 unidades)
     */
    public List<Instrumento> findInstrumentosConBajoStock() {
        return instrumentoRepository.findAll().stream()
                .filter(i -> i.getStock() < 5)
                .toList();
    }
}
