package com.example.instrumentos.dto.response;

import com.example.instrumentos.model.Rol;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private Long id;
    private String email;
    private Rol rol;
    private String token;
    private boolean success;
    private String message;
    private boolean activo;
}