# 🎵 Musical Hendrix - E-commerce de Instrumentos Musicales

<div align="center">

![Java](https://img.shields.io/badge/Java-21-red?style=for-the-badge&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.0-green?style=for-the-badge&logo=spring)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![MySQL](https://img.shields.io/badge/MySQL-8-orange?style=for-the-badge&logo=mysql)
![MercadoPago](https://img.shields.io/badge/MercadoPago-API-lightblue?style=for-the-badge)

**Aplicación completa de e-commerce para una tienda de instrumentos musicales**

## [Demo](#demo) • [Características](#características) • [Instalación](#instalación) • [API](#api)

## 📖 Descripción

Musical Hendrix es una aplicación web de e-commerce desarrollada para una tienda de instrumentos musicales en Mendoza, Argentina. Permite navegar el catálogo, comprar, pagar con MercadoPago y gestionar usuarios con diferentes roles.

## ✨ Características Principales

- Catálogo de productos con filtros
- Carrito de compras persistente
- Gestión de stock y precios
- Pagos con MercadoPago (sandbox y producción)
- Webhooks para pagos
- Registro/login, recuperación de contraseña por email
- Sistema de roles (Admin, Operador, Visor)
- Emails automáticos (bienvenida, recuperación)
- CRUD de instrumentos y gestión de inventario

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Java 21+**
- Node.js 16+
- MySQL 8+
- Maven 3.6+

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/musical-hendrix.git
cd musical-hendrix
```

### 2. Configurar archivos de propiedades

En la carpeta `instrumentos/src/main/resources/` encontrarás archivos terminados en `.example` (por ejemplo, `application.properties.example`, `mail.properties.example`, `mercadopago.properties.example`).  
**Debes copiar cada archivo, renombrarlo quitando `.example` y completar tus credenciales:**

```powershell
# Ejemplo en Windows PowerShell
Copy-Item application.properties.example application.properties
Copy-Item mail.properties.example mail.properties
Copy-Item mercadopago.properties.example mercadopago.properties
```

Edita los archivos nuevos (`.properties`) y coloca tus datos de conexión, email y credenciales de MercadoPago.

### 3. Configurar Gmail (para emails)

1. Activa la verificación en 2 pasos en Gmail.
2. Genera una App Password en: https://myaccount.google.com/apppasswords
3. Coloca el usuario y la App Password en `mail.properties`.

### 4. Configurar MercadoPago

1. Crea una cuenta en: https://www.mercadopago.com.ar/developers
2. Obtén tus credenciales de test y producción.
3. Coloca el access token en `mercadopago.properties`.

### 5. Ejecutar Backend

```bash
cd instrumentos
mvn clean install
mvn spring-boot:run
```

### 6. Ejecutar Frontend

```bash
cd instrumentos-app
npm install
npm run dev
```

### 7. Acceder a la aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/swagger-ui.html

## 📚 API Endpoints

### Autenticación

```
POST /api/usuarios/login
POST /api/usuarios/registro
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Instrumentos

```
GET    /api/instrumentos
GET    /api/instrumentos/{id}
POST   /api/instrumentos
PUT    /api/instrumentos/{id}
DELETE /api/instrumentos/{id}
PATCH  /api/instrumentos/{id}/precio
PATCH  /api/instrumentos/{id}/stock
```

### Pedidos

```
GET  /api/pedidos
GET  /api/pedidos/usuario/{id}
POST /api/pedidos
PATCH /api/pedidos/{id}/estado
```

### Pagos

```
POST /api/pagos/crear/{pedidoId}
POST /api/pagos/webhook
GET  /api/pagos/pedido/{id}
```

## 👥 Usuarios de Prueba

| Email                  | Contraseña | Rol   |
| ---------------------- | ---------- | ----- |
| admin@instrumentos.com | admin123   | Admin |

## 🧪 Testing

### Flujo de Compra Completo

1. Registrar usuario
2. Navegar productos
3. Agregar al carrito
4. Realizar pedido
5. Pagar con MercadoPago (sandbox)
6. Verificar stock actualizado

### Credenciales de Prueba MercadoPago

- **Tarjeta de crédito**: 4509 9535 6623 3704
- **CVV**: 123
- **Vencimiento**: Cualquier fecha futura
- **Titular**: APRO (aprobado) / CONT (rechazado)
