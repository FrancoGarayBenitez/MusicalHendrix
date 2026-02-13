import { useState, useEffect } from "react";
import { Instrumento } from "../../types/types";
import { useCategorias } from "../../hooks/useCategorias";
import { uploadImagen } from "../../service/api";

interface InstrumentoFormProps {
  instrumento?: Instrumento;
  onSubmit: (data: Omit<Instrumento, "idInstrumento">) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const defaultInstrumento: Omit<Instrumento, "idInstrumento"> = {
  denominacion: "",
  marca: "",
  stock: 0,
  descripcion: "",
  imagen: "",
  precioActual: 0,
  categoriaInstrumento: {
    idCategoriaInstrumento: 0,
    denominacion: "",
  },
};

const InstrumentoForm = ({
  instrumento,
  onSubmit,
  onCancel,
  isSubmitting,
}: InstrumentoFormProps) => {
  const { categorias, loading: loadingCategorias } = useCategorias();
  const [formData, setFormData] = useState<Omit<Instrumento, "idInstrumento">>(
    instrumento
      ? {
          denominacion: instrumento.denominacion,
          marca: instrumento.marca,
          stock: instrumento.stock,
          descripcion: instrumento.descripcion,
          imagen: instrumento.imagen,
          precioActual: instrumento.precioActual || 0,
          categoriaInstrumento: instrumento.categoriaInstrumento,
          // ✅ historialPrecios se ignora en el form (solo lectura en backend)
        }
      : defaultInstrumento,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ✅ Función para obtener la URL correcta de la imagen
  const getImageUrl = (imageName: string) => {
    if (!imageName) return null;

    // Si es una imagen subida por el admin (nombre con timestamp: 1234567890_archivo.jpg)
    if (/^\d{10,}_/.test(imageName)) {
      return `http://localhost:8080/api/uploads/images/${imageName}`;
    }

    // Si es una imagen del seeder (carpeta public del frontend)
    return `/images/${imageName}`;
  };

  // Actualiza el formData y la vista previa cuando cambia el instrumento
  useEffect(() => {
    if (instrumento) {
      console.log("📝 Editando instrumento:", instrumento);

      setFormData({
        denominacion: instrumento.denominacion,
        marca: instrumento.marca,
        stock: instrumento.stock,
        descripcion: instrumento.descripcion,
        imagen: instrumento.imagen,
        precioActual: instrumento.precioActual || 0,
        categoriaInstrumento: instrumento.categoriaInstrumento,
      });

      // Limpiar la vista previa de una carga anterior y mostrar la imagen actual
      setPreviewUrl(null);
    } else {
      // Si es un formulario nuevo, resetear todo
      console.log("➕ Creando nuevo instrumento");
      setFormData(defaultInstrumento);
      setPreviewUrl(null);
      setErrors({});
    }
  }, [instrumento]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    let parsedValue: string | number = value;

    // ✅ Parse numérico para precioActual y stock
    if ((name === "precioActual" || name === "stock") && type === "number") {
      parsedValue = value === "" ? 0 : parseFloat(value);
    }

    // ✅ Manejo especial para categoría
    if (name === "idCategoriaInstrumento") {
      const categoriaId = parseInt(value);
      const categoria = categorias.find(
        (cat) => cat.idCategoriaInstrumento === categoriaId,
      );

      setFormData((prevData) => ({
        ...prevData,
        categoriaInstrumento: {
          idCategoriaInstrumento: categoriaId,
          denominacion: categoria?.denominacion || "",
        },
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: parsedValue,
      }));
    }

    // Limpiar el error al cambiar el valor
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // ✅ Validar campos obligatorios
    if (!formData.denominacion.trim()) {
      newErrors.denominacion = "La denominación del instrumento es obligatoria";
    } else if (formData.denominacion.length > 100) {
      newErrors.denominacion =
        "La denominación no puede exceder 100 caracteres";
    }

    if (!formData.marca.trim()) {
      newErrors.marca = "La marca es obligatoria";
    } else if (formData.marca.length > 50) {
      newErrors.marca = "La marca no puede exceder 50 caracteres";
    }

    if (!formData.imagen.trim()) {
      newErrors.imagen = "La imagen es obligatoria";
    }

    if ((formData.precioActual || 0) <= 0) {
      newErrors.precioActual = "El precio debe ser mayor que cero";
    } else if ((formData.precioActual || 0) > 999999999.99) {
      newErrors.precioActual = "El precio es demasiado alto";
    }

    if (formData.stock < 0) {
      newErrors.stock = "El stock no puede ser negativo";
    } else if (formData.stock > 999999) {
      newErrors.stock = "El stock es demasiado alto";
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es obligatoria";
    } else if (formData.descripcion.length > 500) {
      newErrors.descripcion = "La descripción no puede exceder 500 caracteres";
    }

    if (!formData.categoriaInstrumento.idCategoriaInstrumento) {
      newErrors.idCategoriaInstrumento = "Debe seleccionar una categoría";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log("❌ Errores de validación:", newErrors);
      return false;
    }

    return true;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Validar tipo de archivo
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        imagen: "Solo se permiten imágenes (JPG, PNG, GIF, WEBP)",
      }));
      return;
    }

    // ✅ Validar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        imagen: "La imagen no puede superar 5MB",
      }));
      return;
    }

    setUploading(true);
    console.log("📤 Subiendo imagen:", file.name);

    try {
      // Vista previa local
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Subida al backend
      const result = await uploadImagen(file);
      console.log("✅ Imagen subida:", result.fileName);

      setFormData((prev) => ({
        ...prev,
        imagen: result.fileName,
      }));

      setErrors((prev) => ({ ...prev, imagen: "" }));
    } catch (error) {
      console.error("❌ Error al subir imagen:", error);
      setErrors((prev) => ({
        ...prev,
        imagen:
          error instanceof Error
            ? error.message
            : "Error al subir la imagen. Intente nuevamente.",
      }));
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  // ✅ Nueva función para eliminar la imagen
  const handleRemoveImage = () => {
    console.log("🗑️ Eliminando imagen");

    setFormData((prev) => ({ ...prev, imagen: "" }));
    setPreviewUrl(null);

    // Limpiar input de archivo para permitir re-selección
    const fileInput = document.getElementById("imagen") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("📝 Intentando enviar formulario...");

    if (!validate()) {
      console.log("❌ Validación fallida");
      // Scroll al primer error
      const firstError = document.querySelector(".error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      console.log("✅ Validación exitosa, enviando datos:", formData);
      await onSubmit(formData);
    } catch (error) {
      console.error("❌ Error al enviar formulario:", error);
      alert(
        `Error al guardar el instrumento: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Título del formulario */}
        <div className="text-center border-b border-slate-200 pb-6">
          <h2 className="text-3xl font-bold text-musical-slate flex items-center justify-center">
            <span className="mr-3 text-4xl">{instrumento ? "✏️" : "➕"}</span>
            {instrumento ? "Editar Instrumento" : "Nuevo Instrumento"}
          </h2>
          <p className="text-slate-600 mt-2">
            {instrumento
              ? "Modifica la información del instrumento"
              : "Completa todos los campos para agregar un nuevo instrumento"}
          </p>
        </div>

        {/* Denominación */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-musical-slate mb-4 flex items-center">
            <span className="mr-2">🎵</span>
            Información básica
          </h3>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="denominacion"
                className="block text-sm font-semibold text-musical-slate mb-2"
              >
                Denominación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="denominacion"
                name="denominacion"
                value={formData.denominacion}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-4 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                  errors.denominacion
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-musical-teal focus:ring-musical-teal/10"
                }`}
                disabled={isSubmitting}
                placeholder="Ej: Guitarra Eléctrica Stratocaster"
                maxLength={100}
              />
              {errors.denominacion && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.denominacion}
                </p>
              )}
            </div>

            {/* Marca y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="marca"
                  className="block text-sm font-semibold text-musical-slate mb-2"
                >
                  Marca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-4 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                    errors.marca
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-musical-teal focus:ring-musical-teal/10"
                  }`}
                  disabled={isSubmitting}
                  placeholder="Ej: Fender"
                  maxLength={50}
                />
                {errors.marca && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.marca}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="idCategoriaInstrumento"
                  className="block text-sm font-semibold text-musical-slate mb-2"
                >
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  id="idCategoriaInstrumento"
                  name="idCategoriaInstrumento"
                  value={formData.categoriaInstrumento.idCategoriaInstrumento}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-slate-800 focus:ring-4 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                    errors.idCategoriaInstrumento
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-musical-teal focus:ring-musical-teal/10"
                  }`}
                  disabled={isSubmitting || loadingCategorias}
                >
                  <option value="0">
                    {loadingCategorias
                      ? "Cargando..."
                      : "Seleccione una categoría"}
                  </option>
                  {categorias.map((categoria) => (
                    <option
                      key={categoria.idCategoriaInstrumento}
                      value={categoria.idCategoriaInstrumento}
                    >
                      {categoria.denominacion}
                    </option>
                  ))}
                </select>
                {errors.idCategoriaInstrumento && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.idCategoriaInstrumento}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Precio y Stock */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-musical-slate mb-4 flex items-center">
            <span className="mr-2">💰</span>
            Precio e inventario
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="precioActual"
                className="block text-sm font-semibold text-musical-slate mb-2"
              >
                Precio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">
                  $
                </span>
                <input
                  type="number"
                  id="precioActual"
                  name="precioActual"
                  min="0.01"
                  step="0.01"
                  value={formData.precioActual || ""}
                  onChange={handleChange}
                  className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-4 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                    errors.precioActual
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-musical-teal focus:ring-musical-teal/10"
                  }`}
                  disabled={isSubmitting}
                  placeholder="0.00"
                />
              </div>
              {errors.precioActual && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.precioActual}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="stock"
                className="block text-sm font-semibold text-musical-slate mb-2"
              >
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-4 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                  errors.stock
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-musical-teal focus:ring-musical-teal/10"
                }`}
                disabled={isSubmitting}
                placeholder="0"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.stock}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-600">
                Número de unidades disponibles para la venta
              </p>
            </div>
          </div>
        </div>

        {/* Imagen */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-musical-slate mb-4 flex items-center">
            <span className="mr-2">🖼️</span>
            Imagen del instrumento
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="imagen"
                className="block text-sm font-semibold text-musical-slate mb-2"
              >
                Subir imagen <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="imagen"
                name="imagen"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                disabled={isSubmitting || uploading}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-musical-teal file:text-white hover:file:bg-musical-slate file:cursor-pointer cursor-pointer border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-musical-teal transition-colors"
              />
              <p className="mt-1 text-xs text-slate-600">
                Formatos soportados: JPG, PNG, GIF, WEBP. Tamaño máximo: 5MB
              </p>

              {uploading && (
                <div className="mt-2 flex items-center text-musical-teal text-sm font-medium">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Subiendo imagen...
                </div>
              )}

              {errors.imagen && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.imagen}
                </p>
              )}
            </div>

            {/* Vista previa mejorada */}
            {(previewUrl || formData.imagen) && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold text-musical-slate">
                    Vista previa:
                  </h4>
                  <button
                    type="button"
                    className="px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting || uploading}
                  >
                    🗑️ Eliminar
                  </button>
                </div>

                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Vista previa de la nueva imagen"
                        className="w-full h-full object-cover"
                      />
                    ) : formData.imagen ? (
                      <img
                        src={getImageUrl(formData.imagen) || ""}
                        alt="Imagen actual"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(
                            "❌ Error al cargar imagen:",
                            formData.imagen,
                          );
                          e.currentTarget.src = "/images/placeholder.jpg";
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-musical-slate mb-4 flex items-center">
            <span className="mr-2">📝</span>
            Descripción
          </h3>

          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-semibold text-musical-slate mb-2"
            >
              Descripción del instrumento{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={5}
              className={`w-full px-4 py-3 border-2 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-4 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 resize-none ${
                errors.descripcion
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "border-slate-200 focus:border-musical-teal focus:ring-musical-teal/10"
              }`}
              disabled={isSubmitting}
              placeholder="Describe el instrumento, características principales, materiales, etc."
              maxLength={500}
            ></textarea>

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-600">
                Incluye detalles importantes que ayuden a los clientes
              </p>
              <span
                className={`text-xs font-medium ${
                  formData.descripcion.length > 450
                    ? "text-musical-warning"
                    : "text-slate-500"
                }`}
              >
                {formData.descripcion.length}/500
              </span>
            </div>

            {errors.descripcion && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
          <button
            type="button"
            className="flex-1 px-6 py-3 bg-white text-slate-600 border-2 border-slate-200 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-300 focus:ring-4 focus:ring-slate-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className={`flex-1 px-6 py-3 rounded-lg font-semibold focus:ring-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSubmitting || uploading
                ? "bg-slate-400 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-musical-teal to-musical-slate text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-musical-teal/20"
            }`}
            disabled={isSubmitting || uploading}
          >
            <span className="flex items-center justify-center space-x-2">
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Guardando...</span>
                </>
              ) : uploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Subiendo imagen...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">{instrumento ? "✅" : "➕"}</span>
                  <span>{instrumento ? "Actualizar" : "Crear"}</span>
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstrumentoForm;
