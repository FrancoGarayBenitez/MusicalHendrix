package com.example.instrumentos.repository;

import com.example.instrumentos.model.HistorialPrecio;
import com.example.instrumentos.model.Instrumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface HistorialPrecioRepository extends JpaRepository<HistorialPrecio, Long> {

    /**
     * Obtener el precio más reciente (vigente) de un instrumento
     */
    Optional<HistorialPrecio> findFirstByInstrumentoOrderByFechaVigenciaDesc(Instrumento instrumento);

    /**
     * Obtener el precio vigente de un instrumento por ID
     */
    @Query("SELECT h FROM HistorialPrecio h WHERE h.instrumento.idInstrumento = :instrumentoId " +
            "ORDER BY h.fechaVigencia DESC LIMIT 1")
    Optional<HistorialPrecio> findPrecioVigenteByInstrumentoId(@Param("instrumentoId") Long instrumentoId);

    /**
     * Obtener todo el historial de un instrumento ordenado por fecha
     */
    List<HistorialPrecio> findByInstrumentoOrderByFechaVigenciaDesc(Instrumento instrumento);

    /**
     * Obtener historial de precios entre fechas
     */
    @Query("SELECT h FROM HistorialPrecio h WHERE h.instrumento = :instrumento " +
            "AND h.fechaVigencia BETWEEN :fechaInicio AND :fechaFin " +
            "ORDER BY h.fechaVigencia DESC")
    List<HistorialPrecio> findByInstrumentoAndFechaBetween(
            @Param("instrumento") Instrumento instrumento,
            @Param("fechaInicio") Date fechaInicio,
            @Param("fechaFin") Date fechaFin);

    /**
     * Verificar si existe un precio para un instrumento en una fecha específica
     */
    @Query("SELECT COUNT(h) > 0 FROM HistorialPrecio h " +
            "WHERE h.instrumento = :instrumento " +
            "AND DATE(h.fechaVigencia) = DATE(:fecha)")
    boolean existsByInstrumentoAndFecha(
            @Param("instrumento") Instrumento instrumento,
            @Param("fecha") Date fecha);

    /**
     * Obtener todos los precios vigentes (útil para reportes)
     */
    @Query("SELECT h FROM HistorialPrecio h WHERE h.idHistorial IN " +
            "(SELECT MAX(h2.idHistorial) FROM HistorialPrecio h2 GROUP BY h2.instrumento)")
    List<HistorialPrecio> findAllPreciosVigentes();

    /**
     * Obtener instrumentos sin historial de precios
     */
    @Query("SELECT i FROM Instrumento i WHERE i.idInstrumento NOT IN " +
            "(SELECT DISTINCT h.instrumento.idInstrumento FROM HistorialPrecio h)")
    List<Instrumento> findInstrumentosSinHistorial();
}