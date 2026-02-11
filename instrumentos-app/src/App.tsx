import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ===== CONTEXT =====
import { AuthProvider } from "./context/AuthContext";
import { CarritoProvider } from "./context/CarritoContext";

// ===== LAYOUT COMPONENTS =====
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import CarritoDrawer from "./components/carrito/CarritoDrawer";
import ProtectedRoute from "./components/common/ProtectedRoute";

// ===== PUBLIC PAGES =====
import HomePage from "./pages/HomePage";
import ProductosPage from "./pages/ProductosPage";
import DondeEstamosPage from "./pages/DondeEstamosPage";
import DetalleInstrumentoPage from "./pages/DetalleInstrumentoPage";
import AccesoDenegadoPage from "./pages/AccesoDenegadoPage";

// ===== AUTH PAGES =====
import LoginPage from "./pages/LoginPage";
import RegistroPage from "./pages/RegistroPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// ===== USER PAGES (Authenticated) =====
import MisPedidosPage from "./pages/MisPedidosPage";

// ===== PAYMENT PAGES ===== ✅ NUEVO
import PaymentSuccessPage from "./pages/payment/PaymentSuccessPage";
import PaymentFailurePage from "./pages/payment/PaymentFailurePage";
import PaymentPendingPage from "./pages/payment/PaymentPendingPage";
import PaymentRedirectPage from "./pages/payment/PaymentRedirectPage";

// ===== ADMIN PAGES =====
import AdminPage from "./pages/AdminPage";
import GestionUsuariosPage from "./pages/GestionUsuariosPage";
import GestionPedidosPage from "./pages/GestionPedidosPage";

// ===== TYPES =====
import { UserRol } from "./types/auth";

// ===== STYLES =====
import "./App.css";
import "./components/carrito/Carrito.css";
import "./pages/AdminStyles.css";

function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <Router>
          <div className="app">
            <Navbar />

            <main className="main-content">
              <Routes>
                {/* ===== RUTAS PÚBLICAS ===== */}
                <Route path="/" element={<HomePage />} />
                <Route path="/productos" element={<ProductosPage />} />
                <Route path="/donde-estamos" element={<DondeEstamosPage />} />
                <Route
                  path="/instrumento/:id"
                  element={<DetalleInstrumentoPage />}
                />
                <Route
                  path="/acceso-denegado"
                  element={<AccesoDenegadoPage />}
                />

                {/* ===== RUTAS DE AUTENTICACIÓN (públicas) ===== */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegistroPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* ===== RUTAS DE PAGO ===== ✅ NUEVO */}
                <Route
                  path="/payment/success"
                  element={<PaymentSuccessPage />}
                />
                <Route
                  path="/payment/failure"
                  element={<PaymentFailurePage />}
                />
                <Route
                  path="/payment/pending"
                  element={<PaymentPendingPage />}
                />
                <Route
                  path="/payment/redirect"
                  element={<PaymentRedirectPage />}
                />

                {/* ===== RUTAS PROTEGIDAS - USUARIO AUTENTICADO ===== */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/mis-pedidos" element={<MisPedidosPage />} />
                </Route>

                {/* ===== RUTAS PROTEGIDAS - SOLO ADMIN ===== */}
                <Route
                  element={<ProtectedRoute allowedRoles={[UserRol.ADMIN]} />}
                >
                  {/* Dashboard principal de admin */}
                  <Route path="/admin" element={<AdminPage />} />

                  {/* Gestión de usuarios */}
                  <Route
                    path="/admin/usuarios"
                    element={<GestionUsuariosPage />}
                  />

                  {/* Gestión de pedidos */}
                  <Route
                    path="/admin/pedidos"
                    element={<GestionPedidosPage />}
                  />

                  {/* Gestión de instrumentos (productos) */}
                  <Route path="/admin/instrumentos" element={<AdminPage />} />
                </Route>

                {/* ===== RUTA 404 (opcional) ===== */}
                <Route
                  path="*"
                  element={
                    <div className="not-found-page">
                      <h1>404 - Página no encontrada</h1>
                      <p>La página que buscas no existe.</p>
                      <a href="/">Volver al inicio</a>
                    </div>
                  }
                />
              </Routes>
            </main>

            <Footer />

            {/* Carrito lateral (drawer) */}
            <CarritoDrawer />
          </div>
        </Router>
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;
