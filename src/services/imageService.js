const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '../../data/uploads');

// Asegurar existencia del directorio de uploads
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de almacenamiento en memoria para procesar con Sharp antes de escribir al disco
const storage = multer.memoryStorage();

// Filtro para aceptar únicamente imágenes
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WebP, GIF, SVG).'), false);
  }
};

// Límite de tamaño máximo del archivo de entrada (ej: 15MB)
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter
});

/**
 * Optimiza la imagen en memoria y la guarda en disco en formato WebP optimizado
 * @param {Buffer} buffer - Buffer del archivo original
 * @param {string} originalName - Nombre original del archivo
 * @param {string} type - Tipo de imagen ('logo' o 'standard')
 * @returns {Promise<{ filename: string, url: string, sizeBytes: number, format: string, width: number, height: number }>}
 */
async function processAndSaveImage(buffer, originalName, type = 'standard') {
  // Limpiar nombre base seguro
  const cleanBaseName = path
    .parse(originalName)
    .name.toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .substring(0, 30);
  const timestamp = Date.now();
  const filename = `${cleanBaseName}-${timestamp}.webp`;
  const targetPath = path.join(UPLOAD_DIR, filename);

  let sharpInstance = sharp(buffer).rotate(); // auto-rotar según orientación EXIF si existe

  if (type === 'logo') {
    // Configuración para logos: max 600px de ancho/alto manteniendo proporción, calidad nítida
    sharpInstance = sharpInstance.resize({
      width: 600,
      height: 600,
      fit: 'inside',
      withoutEnlargement: true
    }).webp({
      quality: 90,
      alphaQuality: 95,
      lossless: false,
      effort: 6
    });
  } else if (type === 'payment_proof') {
    // Comprobante de pago: max 1280px para mantener números legibles, compresión WebP eficiente
    sharpInstance = sharpInstance.resize({
      width: 1280,
      height: 1280,
      fit: 'inside',
      withoutEnlargement: true
    }).webp({
      quality: 82,
      effort: 4
    });
  } else {
    // Configuración para fotos/galería/banners: max 1920px de ancho
    sharpInstance = sharpInstance.resize({
      width: 1920,
      height: 1440,
      fit: 'inside',
      withoutEnlargement: true
    }).webp({
      quality: 80,
      effort: 4
    });
  }

  const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });
  await fs.promises.writeFile(targetPath, data);

  return {
    filename,
    url: `/uploads/${filename}`,
    sizeBytes: info.size,
    format: info.format,
    width: info.width,
    height: info.height
  };
}

module.exports = {
  upload,
  processAndSaveImage,
  UPLOAD_DIR
};
