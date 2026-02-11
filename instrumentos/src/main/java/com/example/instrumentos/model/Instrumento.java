package com.example.instrumentos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "instrumentos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Instrumento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_instrumento")
    private Long idInstrumento;

    @Column(nullable = false)
    private String denominacion;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private Integer stock = 0;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "imagen")
    private String imagen;

    // Relación con CategoriaInstrumento
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_categoria_instrumento", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "instrumentos" })
    private CategoriaInstrumento categoriaInstrumento;

    // Relación con DetallePedido
    @OneToMany(mappedBy = "instrumento", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DetallePedido> detallesPedido = new ArrayList<>();

    // Relación con HistorialPrecioInstrumento
    @OneToMany(mappedBy = "instrumento", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<HistorialPrecio> historialPrecios = new ArrayList<>();

    // Helper para verificar stock disponible
    public boolean tieneStockDisponible(Integer cantidad) {
        return this.stock >= cantidad;
    }

    // Helper para descontar stock
    public void descontarStock(Integer cantidad) {
        if (!tieneStockDisponible(cantidad)) {
            throw new IllegalStateException(
                    "Stock insuficiente para " + this.denominacion +
                            ". Disponible: " + this.stock + ", Solicitado: " + cantidad);
        }
        this.stock -= cantidad;
    }

    // Helper para reponer stock
    public void reponerStock(Integer cantidad) {
        this.stock += cantidad;
    }

    @Override
    public String toString() {
        return "Instrumento{" +
                "idInstrumento=" + idInstrumento +
                ", denominacion='" + denominacion + '\'' +
                ", marca='" + marca + '\'' +
                ", stock=" + stock +
                ", categoriaId="
                + (categoriaInstrumento != null ? categoriaInstrumento.getIdCategoriaInstrumento() : null) +
                '}';
    }
}
