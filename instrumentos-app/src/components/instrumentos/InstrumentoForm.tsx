import { useState, useEffect } from "react";
import { Instrumento } from "../../types/types";
import { useCategorias } from "../../hooks/useCategorias";
import "./InstrumentoForm.css";
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
    <div className="instrumento-form-container">
      <form className="instrumento-form" onSubmit={handleSubmit}>
        <h2 className="form-title">
          {instrumento ? "Editar Instrumento" : "Nuevo Instrumento"}
        </h2>

        {/* Denominación */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="denominacion">
              Denominación <span className="required">*</span>
            </label>
            <input
              type="text"
              id="denominacion"
              name="denominacion"
              value={formData.denominacion}
              onChange={handleChange}
              className={errors.denominacion ? "error" : ""}
              disabled={isSubmitting}
              placeholder="Ej: Guitarra Eléctrica Stratocaster"
              maxLength={100}
            />
            {errors.denominacion && (
              <span className="error-text">{errors.denominacion}</span>
            )}
          </div>
        </div>

        {/* Marca y Categoría */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="marca">
              Marca <span className="required">*</span>
            </label>
            <input
              type="text"
              id="marca"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              className={errors.marca ? "error" : ""}
              disabled={isSubmitting}
              placeholder="Ej: Fender"
              maxLength={50}
            />
            {errors.marca && <span className="error-text">{errors.marca}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="idCategoriaInstrumento">
              Categoría <span className="required">*</span>
            </label>
            <select
              id="idCategoriaInstrumento"
              name="idCategoriaInstrumento"
              value={formData.categoriaInstrumento.idCategoriaInstrumento}
              onChange={handleChange}
              className={errors.idCategoriaInstrumento ? "error" : ""}
              disabled={isSubmitting || loadingCategorias}
            >
              <option value="0">
                {loadingCategorias ? "Cargando..." : "Seleccione una categoría"}
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
              <span className="error-text">
                {errors.idCategoriaInstrumento}
              </span>
            )}
          </div>
        </div>

        {/* Precio y Stock */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="precioActual">
              Precio <span className="required">*</span>
            </label>
            <input
              type="number"
              id="precioActual"
              name="precioActual"
              min="0.01"
              step="0.01"
              value={formData.precioActual || ""}
              onChange={handleChange}
              className={errors.precioActual ? "error" : ""}
              disabled={isSubmitting}
              placeholder="0.00"
            />
            {errors.precioActual && (
              <span className="error-text">{errors.precioActual}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="stock">
              Stock <span className="required">*</span>
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              min="0"
              step="1"
              value={formData.stock}
              onChange={handleChange}
              className={errors.stock ? "error" : ""}
              disabled={isSubmitting}
              placeholder="0"
            />
            {errors.stock && <span className="error-text">{errors.stock}</span>}
          </div>
        </div>

        {/* Imagen */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="imagen">
              Imagen <span className="required">*</span>
            </label>
            <input
              type="file"
              id="imagen"
              name="imagen"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              disabled={isSubmitting || uploading}
            />
            {uploading && (
              <span className="upload-status">⏳ Subiendo imagen...</span>
            )}
            {errors.imagen && (
              <span className="error-text">{errors.imagen}</span>
            )}

            {/* ✅ Vista previa mejorada */}
            <div className="image-preview-container">
              {previewUrl ? (
                // 1. Muestra la nueva imagen seleccionada
                <img
                  src={previewUrl}
                  alt="Vista previa de la nueva imagen"
                  className="image-preview"
                />
              ) : formData.imagen ? (
                // 2. Muestra la imagen existente si no hay nueva
                <img
                  src={getImageUrl(formData.imagen) || ""}
                  alt="Imagen actual"
                  className="image-preview"
                  onError={(e) => {
                    console.error(
                      "❌ Error al cargar imagen:",
                      formData.imagen,
                    );
                    e.currentTarget.src = "/images/placeholder.jpg";
                  }}
                />
              ) : null}

              {/* Botón para eliminar la imagen */}
              {(formData.imagen || previewUrl) && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting || uploading}
                >
                  🗑️ Eliminar Imagen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label htmlFor="descripcion">
            Descripción <span className="required">*</span>
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={5}
            className={errors.descripcion ? "error" : ""}
            disabled={isSubmitting}
            placeholder="Describe el instrumento, características principales, etc."
            maxLength={500}
          ></textarea>
          <small className="char-count">
            {formData.descripcion.length}/500 caracteres
          </small>
          {errors.descripcion && (
            <span className="error-text">{errors.descripcion}</span>
          )}
        </div>

        {/* Acciones */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || uploading}
          >
            {isSubmitting
              ? "Guardando..."
              : uploading
                ? "Subiendo imagen..."
                : instrumento
                  ? "✅ Actualizar"
                  : "➕ Crear"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstrumentoForm;
