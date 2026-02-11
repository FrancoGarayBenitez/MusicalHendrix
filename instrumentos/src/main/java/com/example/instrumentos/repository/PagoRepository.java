package com.example.instrumentos.repository;

import com.example.instrumentos.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    // Buscar pago por preference ID de MercadoPago
    Optional<Pago> findByMercadoPagoPreferenceId(String preferenceId);

    // Buscar todos los pagos de un pedido
    List<Pago> findByPedido_IdPedido(Long pedidoId);

    // Buscar pagos de un pedido con un estado específico
    Optional<Pago> findByPedido_IdPedidoAndEstado(Long pedidoId, String estado);

    // Buscar pagos por estado
    List<Pago> findByEstado(String estado);
}
