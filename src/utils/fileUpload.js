import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Configuración de almacenamiento en memoria para procesar archivos
const memoryStorage = multer.memoryStorage();

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "reviews");

    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mov",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten: JPEG, PNG, GIF, WEBP, MP4, MOV`
      ),
      false
    );
  }
};

// Configuración de multer con almacenamiento en memoria
export const uploadReviewMedia = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB por archivo
    files: 10, // Máximo 10 archivos por reseña
  },
});

// Función para validar archivos después del upload
export const validateUploadedFiles = (files) => {
  const errors = [];

  if (!files || files.length === 0) {
    return { isValid: true, errors: [] }; // Media es opcional
  }

  files.forEach((file, index) => {
    // Verificar tamaño del archivo
    if (file.size > 50 * 1024 * 1024) {
      errors.push(`Archivo ${index + 1}: Tamaño excede 50MB`);
    }

    // Verificar tipo MIME
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime", // Para .mov
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(
        `Archivo ${index + 1}: Tipo no permitido (${file.mimetype})`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Función para generar URL del archivo
export const getFileUrl = (filename) => {
  return `${process.env.BASE_URL || "http://localhost:3000"}/uploads/reviews/${filename}`;
};

// Función para eliminar archivo del sistema de archivos
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error eliminando archivo:", error);
  }
};