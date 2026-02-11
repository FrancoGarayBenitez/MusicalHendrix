package com.example.instrumentos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Long idPedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "pedidos" })
    private Usuario usuario;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date fecha;

    @Column(name = "total_pedido")
    private Double totalPedido = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPedido estado = EstadoPedido.PENDIENTE_PAGO;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "fecha_actualizacion_estado")
    private Date fechaActualizacionEstado;

    // Relación con DetallePedido
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("pedido")
    private List<DetallePedido> detalles = new ArrayList<>();

    // Relación con Pagos
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Pago> pagos = new ArrayList<>();

    // Métodos helper para gestionar detalles
    public void addDetalle(DetallePedido detalle) {
        detalles.add(detalle);
        detalle.setPedido(this);
    }

    public void removeDetalle(DetallePedido detalle) {
        detalles.remove(detalle);
        detalle.setPedido(null);
    }

    // Calcular total del pedido a partir de los detalles
    public void calcularTotal() {
        if (detalles == null || detalles.isEmpty()) {
            this.totalPedido = 0.0;
            return;
        }
        this.totalPedido = detalles.stream()
                .mapToDouble(d -> d.getCantidad() * d.getPrecioUnitario())
                .sum();
    }

    // Obtener el pago más reciente
    public Pago getUltimoPago() {
        if (pagos == null || pagos.isEmpty()) {
            return null;
        }
        return pagos.stream()
                .max((p1, p2) -> p1.getFechaCreacion().compareTo(p2.getFechaCreacion()))
                .orElse(null);
    }

    // Verificar si hay un pago aprobado
    public boolean tienePagoAprobado() {
        if (pagos == null || pagos.isEmpty()) {
            return false;
        }
        return pagos.stream().anyMatch(Pago::isAprobado);
    }

    @PrePersist
    protected void onCreate() {
        if (fecha == null) {
            fecha = new Date();
        }
        if (fechaActualizacionEstado == null) {
            fechaActualizacionEstado = new Date();
        }
        if (estado == null) {
            estado = EstadoPedido.PENDIENTE_PAGO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacionEstado = new Date();
    }

    @Override
    public String toString() {
        return "Pedido{" +
                "idPedido=" + idPedido +
                ", fecha=" + fecha +
                ", totalPedido=" + totalPedido +
                ", estado=" + estado +
                ", usuarioId=" + (usuario != null ? usuario.getIdUsuario() : null) +
                ", cantidadDetalles=" + (detalles != null ? detalles.size() : 0) +
                ", cantidadPagos=" + (pagos != null ? pagos.size() : 0) +
                '}';
    }
}
