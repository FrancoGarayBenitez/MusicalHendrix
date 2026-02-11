package com.example.instrumentos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "detalle_pedido")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle_pedido")
    private Long idDetallePedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_instrumento", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "detallesPedido", "historialPrecios" })
    private Instrumento instrumento;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false)
    private Double precioUnitario;

    // Constructor conveniente
    public DetallePedido(Pedido pedido, Instrumento instrumento, Integer cantidad, Double precioUnitario) {
        this.pedido = pedido;
        this.instrumento = instrumento;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }

    // Helper para calcular subtotal
    public Double getSubtotal() {
        return cantidad * precioUnitario;
    }

    // Helper para obtener el ID del instrumento
    @Transient
    public Long getInstrumentoId() {
        return instrumento != null ? instrumento.getIdInstrumento() : null;
    }

    @Override
    public String toString() {
        return "DetallePedido{" +
                "idDetallePedido=" + idDetallePedido +
                ", instrumentoId=" + getInstrumentoId() +
                ", cantidad=" + cantidad +
                ", precioUnitario=" + precioUnitario +
                ", pedidoId=" + (pedido != null ? pedido.getIdPedido() : null) +
                '}';
    }
}