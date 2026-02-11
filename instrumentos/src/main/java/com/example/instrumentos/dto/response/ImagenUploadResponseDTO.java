package com.example.instrumentos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ImagenUploadResponseDTO {
    private String fileName;
    private String url;
}