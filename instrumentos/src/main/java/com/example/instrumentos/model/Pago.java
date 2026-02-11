package com.example.instrumentos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.Date;

@Entity
@Table(name = "pagos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago")
    private Long idPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Pedido pedido;

    @Column(nullable = false)
    private Double monto;

    @Column(name = "mercadopago_preference_id", unique = true, length = 100)
    private String mercadoPagoPreferenceId;

    @Column(name = "mercadopago_payment_id", length = 100)
    private String mercadoPagoPaymentId;

    @Column(length = 50, nullable = false)
    private String estado = "pending"; // pending, approved, rejected, cancelled, in_process

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago; // credit_card, debit_card, etc.

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "fecha_creacion", nullable = false)
    private Date fechaCreacion;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "fecha_actualizacion")
    private Date fechaActualizacion;

    // Constructor conveniente
    public Pago(Pedido pedido, Double monto, String preferenceId) {
        this.pedido = pedido;
        this.monto = monto;
        this.mercadoPagoPreferenceId = preferenceId;
        this.estado = "pending";
        this.fechaCreacion = new Date();
    }

    // Helpers para verificar estado
    public boolean isAprobado() {
        return "approved".equalsIgnoreCase(this.estado);
    }

    public boolean isPendiente() {
        return "pending".equalsIgnoreCase(this.estado) ||
                "in_process".equalsIgnoreCase(this.estado);
    }

    public boolean isRechazado() {
        return "rejected".equalsIgnoreCase(this.estado) ||
                "cancelled".equalsIgnoreCase(this.estado);
    }

    public boolean isFinal() {
        return isAprobado() || isRechazado();
    }

    // Actualizar estado
    public void actualizarEstado(String nuevoEstado, String paymentId, String metodoPago) {
        this.estado = nuevoEstado;
        this.mercadoPagoPaymentId = paymentId;
        this.metodoPago = metodoPago;
        this.fechaActualizacion = new Date();
    }

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null) {
            fechaCreacion = new Date();
        }
        if (estado == null) {
            estado = "pending";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = new Date();
    }

    @Override
    public String toString() {
        return "Pago{" +
                "idPago=" + idPago +
                ", pedidoId=" + (pedido != null ? pedido.getIdPedido() : null) +
                ", monto=" + monto +
                ", estado='" + estado + '\'' +
                ", metodoPago='" + metodoPago + '\'' +
                ", preferenceId='" + mercadoPagoPreferenceId + '\'' +
                ", paymentId='" + mercadoPagoPaymentId + '\'' +
                ", fechaCreacion=" + fechaCreacion +
                '}';
    }
}