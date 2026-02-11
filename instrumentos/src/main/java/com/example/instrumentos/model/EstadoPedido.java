package com.example.instrumentos.model;

public enum EstadoPedido {
    PENDIENTE_PAGO("Pendiente de Pago", "Esperando confirmación del pago"),
    PAGADO("Pagado", "Pago confirmado"),
    ENVIADO("Enviado", "Pedido despachado"),
    ENTREGADO("Entregado", "Pedido recibido por el cliente"),
    CANCELADO("Cancelado", "Pedido cancelado");

    private final String displayName;
    private final String descripcion;

    EstadoPedido(String displayName, String descripcion) {
        this.displayName = displayName;
        this.descripcion = descripcion;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescripcion() {
        return descripcion;
    }

    // Validar transiciones permitidas
    public boolean puedeTransicionarA(EstadoPedido nuevoEstado) {
        switch (this) {
            case PENDIENTE_PAGO:
                return nuevoEstado == PAGADO || nuevoEstado == CANCELADO;
            case PAGADO:
                return nuevoEstado == ENVIADO || nuevoEstado == CANCELADO;
            case ENVIADO:
                return nuevoEstado == ENTREGADO;
            case ENTREGADO:
            case CANCELADO:
                return false; // Estados finales
            default:
                return false;
        }
    }

    // Helper para saber si es un estado final
    public boolean esFinal() {
        return this == ENTREGADO || this == CANCELADO;
    }

    // Helper para saber si requiere acción del usuario
    public boolean requiereAccionUsuario() {
        return this == PENDIENTE_PAGO;
    }
}