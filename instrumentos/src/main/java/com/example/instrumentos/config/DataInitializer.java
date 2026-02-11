package com.example.instrumentos.config;

import com.example.instrumentos.model.*;
import com.example.instrumentos.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.io.InputStream;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements org.springframework.boot.CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final CategoriaInstrumentoRepository categoriaRepository;
    private final InstrumentoRepository instrumentoRepository;
    private final HistorialPrecioRepository historialPrecioRepository;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // inicializa usuario admin
        inicializarUsuarioAdmin();

        // inicializa categorias
        inicializarCategorias();

        // carga los instrumentos desde JSON
        loadInstrumentosFromJson();
    }

    private void inicializarUsuarioAdmin() {
        if (usuarioRepository.count() == 0) {
            log.info("Creando usuario administrador...");

            Usuario admin = new Usuario();
            admin.setNombre("Administrador");
            admin.setApellido("Sistema");
            admin.setEmail("admin@instrumentos.com");
            // contraseña: admin123 encriptada con BCrypt
            admin.setContrasenia(passwordEncoder.encode("admin123"));
            admin.setRol(Rol.ADMIN); // Usar el enum directamente
            admin.setActivo(true);

            usuarioRepository.save(admin);
            log.info("Usuario administrador creado exitosamente - Email: admin@instrumentos.com");
        }
    }

    private void inicializarCategorias() {
        if (categoriaRepository.count() == 0) {
            log.info("Inicializando categorías...");
            categoriaRepository.save(new CategoriaInstrumento("Cuerda"));
            categoriaRepository.save(new CategoriaInstrumento("Viento"));
            categoriaRepository.save(new CategoriaInstrumento("Percusión"));
            categoriaRepository.save(new CategoriaInstrumento("Teclado"));
            categoriaRepository.save(new CategoriaInstrumento("Varios"));
            log.info("Categorías creadas exitosamente");
        }
    }

    private void loadInstrumentosFromJson() {
        try {
            if (instrumentoRepository.count() > 0) {
                log.info("Los instrumentos ya están cargados en la base de datos");
                return;
            }

            log.info("Intentando cargar instrumentos desde archivo JSON...");

            Resource resource = resourceLoader.getResource("classpath:data/instrumentos.json");

            if (!resource.exists()) {
                log.warn("No se encontró el archivo instrumentos.json en la ruta classpath:data/");
                return;
            }

            try (InputStream inputStream = resource.getInputStream()) {
                JsonNode rootNode = objectMapper.readTree(inputStream);
                JsonNode instrumentosNode = rootNode.get("instrumentos");

                if (instrumentosNode != null && instrumentosNode.isArray()) {
                    int count = 0;

                    for (JsonNode instrumentoNode : instrumentosNode) {
                        try {
                            Instrumento instrumento = new Instrumento();

                            String denominacion = instrumentoNode.get("denominacion").asText();
                            instrumento.setDenominacion(denominacion);
                            instrumento.setMarca(instrumentoNode.get("marca").asText());
                            instrumento.setStock(instrumentoNode.get("stock").asInt());
                            instrumento.setDescripcion(instrumentoNode.get("descripcion").asText());
                            instrumento.setImagen(instrumentoNode.get("imagen").asText());

                            // Asignar categoría
                            CategoriaInstrumento categoria = determinarCategoria(denominacion);
                            if (categoria == null) {
                                log.warn("No se pudo determinar la categoría para el instrumento: {}", denominacion);
                                continue;
                            }
                            instrumento.setCategoriaInstrumento(categoria);

                            log.info("Instrumento: '{}' | Categoría asignada: '{}'", denominacion,
                                    categoria.getDenominacion());

                            // Guardar instrumento
                            instrumento = instrumentoRepository.save(instrumento);

                            // Obtener el precio del JSON
                            Double precioActual = instrumentoNode.get("precioActual").asDouble();
                            // Crear historial de precio
                            HistorialPrecio historialPrecio = new HistorialPrecio(instrumento,
                                    precioActual);
                            historialPrecioRepository.save(historialPrecio);

                            count++;
                        } catch (Exception ex) {
                            log.error("Error al cargar instrumento: {} | Detalle: {}", instrumentoNode.toString(),
                                    ex.getMessage());
                        }
                    }

                    log.info("Se han cargado {} instrumentos desde el archivo JSON", count);
                } else {
                    log.error("No se encontró el array 'instrumentos' en el archivo JSON");
                }
            }
        } catch (IOException e) {
            log.error("Error al cargar instrumentos desde JSON: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Error inesperado al cargar instrumentos: {}", e.getMessage());
        }
    }

    private CategoriaInstrumento determinarCategoria(String nombreInstrumento) {
        String nombre = nombreInstrumento.toLowerCase();

        if (nombre.contains("guitarra") || nombre.contains("mandolina") || nombre.contains("violin")) {
            return categoriaRepository.findByDenominacion("Cuerda")
                    .orElseThrow(() -> new RuntimeException("Categoría Cuerda no encontrada"));
        } else if (nombre.contains("flauta") || nombre.contains("saxo") || nombre.contains("trompeta")) {
            return categoriaRepository.findByDenominacion("Viento")
                    .orElseThrow(() -> new RuntimeException("Categoría Viento no encontrada"));
        } else if (nombre.contains("batería") || nombre.contains("percusión") ||
                nombre.contains("pandereta") || nombre.contains("triangulo")) {
            return categoriaRepository.findByDenominacion("Percusión")
                    .orElseThrow(() -> new RuntimeException("Categoría Percusión no encontrada"));
        } else if (nombre.contains("piano") || nombre.contains("teclado") || nombre.contains("organo")) {
            return categoriaRepository.findByDenominacion("Teclado")
                    .orElseThrow(() -> new RuntimeException("Categoría Teclado no encontrada"));
        } else {
            return categoriaRepository.findByDenominacion("Varios")
                    .orElseThrow(() -> new RuntimeException("Categoría Varios no encontrada"));
        }
    }
}