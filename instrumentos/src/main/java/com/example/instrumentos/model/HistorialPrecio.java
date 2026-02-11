package com.example.instrumentos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.Date;

@Entity
@Table(name = "historial_precio_instrumento")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistorialPrecio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial")
    private Long idHistorial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_instrumento", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Instrumento instrumento;

    @Column(nullable = false)
    private Double precio;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "fecha_vigencia", nullable = false)
    private Date fechaVigencia;

    // Constructor conveniente para crear historial con precio
    public HistorialPrecio(Instrumento instrumento, Double precio) {
        this.instrumento = instrumento;
        this.precio = precio;
        this.fechaVigencia = new Date();
    }

    // Helper para verificar si el precio está vigente
    public boolean esVigente() {
        Date ahora = new Date();
        return !this.fechaVigencia.after(ahora);
    }

    // Helper para comparar con otro precio
    public boolean esDiferenteA(Double otroPrecio) {
        if (otroPrecio == null)
            return true;
        return Math.abs(this.precio - otroPrecio) > 0.01; // Tolerancia de 1 centavo
    }

    @PrePersist
    protected void onCreate() {
        if (fechaVigencia == null) {
            fechaVigencia = new Date();
        }
    }

    @Override
    public String toString() {
        return "HistorialPrecio{" +
                "idHistorial=" + idHistorial +
                ", instrumentoId=" + (instrumento != null ? instrumento.getIdInstrumento() : null) +
                ", precio=" + precio +
                ", fechaVigencia=" + fechaVigencia +
                '}';
    }
}
