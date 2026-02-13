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

// ===== PAYMENT PAGES =====
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
import "./pages/AdminStyles.css";

function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

                {/* ===== RUTAS DE AUTENTICACIÓN ===== */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegistroPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* ===== RUTAS DE PAGO ===== */}
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
                  <Route path="/admin" element={<AdminPage />} />
                  <Route
                    path="/admin/usuarios"
                    element={<GestionUsuariosPage />}
                  />
                  <Route
                    path="/admin/pedidos"
                    element={<GestionPedidosPage />}
                  />
                  <Route path="/admin/instrumentos" element={<AdminPage />} />
                </Route>

                {/* ===== RUTA 404 ===== */}
                <Route
                  path="*"
                  element={
                    <div className="text-center py-16">
                      <h1 className="text-4xl font-bold text-slate-800 mb-4">
                        404 - Página no encontrada
                      </h1>
                      <p className="text-slate-600 mb-6">
                        La página que buscas no existe.
                      </p>
                      <a
                        href="/"
                        className="inline-block bg-musical-teal text-white px-6 py-3 rounded-lg hover:bg-musical-slate transition-colors"
                      >
                        Volver al inicio
                      </a>
                    </div>
                  }
                />
              </Routes>
            </main>

            <Footer />
            <CarritoDrawer />
          </div>
        </Router>
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;
