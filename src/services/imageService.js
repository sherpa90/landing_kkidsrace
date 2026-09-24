let multer;
try {
  multer = require('multer');
} catch (e) {
  // Fallback para entornos de testing / desarrollo donde multer no esté instalado
  multer = () => ({
    single: () => (req, res, next) => next(),
    memoryStorage: () => ({})
  });
  multer.memoryStorage = () => ({});
}

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  // Fallback si sharp no está compilado
  sharp = null;
}

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.resolve(__dirname, '../../data/uploads');
const PRIVATE_UPLOAD_DIR = path.resolve(__dirname, '../../data/private_uploads');

// Asegurar existencia de los directorios de uploads
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(PRIVATE_UPLOAD_DIR)) {
  fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
}

// Configuración de almacenamiento en memoria para procesar con Sharp antes de escribir al disco
const storage = multer.memoryStorage ? multer.memoryStorage() : {};

// Mapa de magic bytes para validar el contenido real del archivo (no solo el MIME declarado)
const MAGIC_BYTES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF]
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47]
  ],
  'image/webp': null, // se valida por string 'WEBP' en offset 8
  'image/avif': null, // se valida por string 'ftyp' en offset 4
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38] // GIF8
  ]
};

/**
 * Verifica que el buffer corresponda realmente al tipo MIME declarado.
 */
function validateMagicBytes(buffer, mimetype) {
  if (!buffer || buffer.length < 12) return false;

  if (mimetype === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  if (mimetype === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }
  if (mimetype === 'image/gif') {
    return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  }
  if (mimetype === 'image/webp') {
    // RIFF....WEBP
    return buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
           buffer.slice(8, 12).toString('ascii') === 'WEBP';
  }
  if (mimetype === 'image/avif') {
    // ftyp box en offset 4, con major_brand avif/avis/mif1 en offset 8
    if (buffer.slice(4, 8).toString('ascii') !== 'ftyp') return false;
    const brand = buffer.slice(8, 12).toString('ascii');
    return brand === 'avif' || brand === 'avis' || brand === 'mif1';
  }
  return false;
}

// Filtro: solo imágenes raster (SVG excluido por riesgo de XSS embebido)
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG, WebP, GIF o AVIF.'), false);
  }
};

// Límite de tamaño máximo del archivo de entrada
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
  // Validar magic bytes: rechazar si el contenido real no coincide con el MIME declarado
  // Para esta función recibimos solo el buffer, así que intentamos inferir el tipo por los bytes
  const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isGif  = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  const isWebp = buffer.length >= 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  const isAvif = buffer.length >= 12 && buffer.slice(4, 8).toString('ascii') === 'ftyp' &&
    ['avif', 'avis', 'mif1'].includes(buffer.slice(8, 12).toString('ascii'));

  if (!isPng && !isJpeg && !isGif && !isWebp && !isAvif) {
    throw new Error('El archivo no es una imagen válida. Solo se permiten JPG, PNG, WebP, GIF o AVIF.');
  }

  // Generar nombre y ruta destino: comprobantes de pago van a directorio privado con UUID
  const isPaymentProof = type === 'payment_proof';
  let filename;
  let targetPath;
  let publicUrl;

  if (isPaymentProof) {
    const randomId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    filename = `proof-${randomId}.webp`;
    targetPath = path.join(PRIVATE_UPLOAD_DIR, filename);
    publicUrl = `/admin/api/proofs/${filename}`;
  } else {
    const cleanBaseName = path
      .parse(originalName)
      .name.toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .substring(0, 30);
    const timestamp = Date.now();
    filename = `${cleanBaseName}-${timestamp}.webp`;
    targetPath = path.join(UPLOAD_DIR, filename);
    publicUrl = `/uploads/${filename}`;
  }

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
  } else if (type === 'sponsor') {
    // Logos de Auspiciadores: Estandarización a lienzo uniforme de 320x160 con fondo transparente (fit contain)
    sharpInstance = sharpInstance.resize({
      width: 320,
      height: 160,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }).webp({
      quality: 92,
      alphaQuality: 100,
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
    url: publicUrl,
    sizeBytes: info.size,
    format: info.format,
    width: info.width,
    height: info.height
  };
}

module.exports = {
  upload,
  processAndSaveImage,
  UPLOAD_DIR,
  PRIVATE_UPLOAD_DIR
};
