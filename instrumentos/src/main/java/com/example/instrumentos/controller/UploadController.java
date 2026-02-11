package com.example.instrumentos.controller;

import com.example.instrumentos.dto.response.ImagenUploadResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads")
public class UploadController {

    @Value("${instrumentos.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<ImagenUploadResponseDTO> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            Path uploadPath = Paths.get(System.getProperty("user.dir"), uploadDir);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(fileName);
            file.transferTo(filePath);

            String url = "/images/" + fileName; // URL pública para acceder a la imagen

            return ResponseEntity.ok(new ImagenUploadResponseDTO(fileName, url));
        } catch (IOException e) {
            e.printStackTrace(); // <--- AGREGAR ESTO
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ImagenUploadResponseDTO(null, "Error: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); // <--- AGREGAR ESTO
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ImagenUploadResponseDTO(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/images/{fileName}")
    public ResponseEntity<byte[]> getImage(@PathVariable String fileName) {
        try {
            Path imagePath = Paths.get(System.getProperty("user.dir"), uploadDir, fileName);

            if (!Files.exists(imagePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] imageBytes = Files.readAllBytes(imagePath);
            String contentType = Files.probeContentType(imagePath);

            return ResponseEntity.ok()
                    .header("Content-Type", contentType != null ? contentType : "image/jpeg")
                    .body(imageBytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
