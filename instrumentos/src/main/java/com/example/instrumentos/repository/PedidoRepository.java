package com.example.instrumentos.repository;

import com.example.instrumentos.model.EstadoPedido;
import com.example.instrumentos.model.Pedido;
import com.example.instrumentos.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

        // Buscar pedidos por usuario
        List<Pedido> findByUsuario_IdUsuario(Long usuarioId);

        // Buscar pedidos por estado
        List<Pedido> findByEstado(EstadoPedido estado);

        // ✅ NUEVO: Buscar pedido pendiente de pago por usuario
        Optional<Pedido> findByUsuarioAndEstado(Usuario usuario, EstadoPedido estado);

        // ✅ NUEVO: Verificar si usuario tiene pedido pendiente (más directo)
        @Query("SELECT COUNT(p) > 0 FROM Pedido p WHERE p.usuario.idUsuario = :usuarioId AND p.estado = :estado")
        boolean existsByUsuarioAndEstado(@Param("usuarioId") Long usuarioId, @Param("estado") EstadoPedido estado);

        // Buscar pedido con detalles e instrumentos cargados
        @Query("SELECT p FROM Pedido p " +
                        "LEFT JOIN FETCH p.detalles d " +
                        "LEFT JOIN FETCH d.instrumento i " +
                        "LEFT JOIN FETCH i.categoriaInstrumento " +
                        "WHERE p.idPedido = :id")
        Optional<Pedido> findByIdWithDetalles(@Param("id") Long id);

        // Buscar pedidos de un usuario con detalles cargados
        @Query("SELECT DISTINCT p FROM Pedido p " +
                        "LEFT JOIN FETCH p.detalles d " +
                        "LEFT JOIN FETCH d.instrumento " +
                        "WHERE p.usuario.idUsuario = :usuarioId " +
                        "ORDER BY p.fecha DESC")
        List<Pedido> findByUsuarioIdWithDetalles(@Param("usuarioId") Long usuarioId);
}
