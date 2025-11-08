import reviewMediaRepository from "../repository/reviewMedia.repository.js";
import logger from "../config/logger.js";

/**
 * Obtiene una lista paginada de media reciente público
 * GET /api/media/recent?page=1&limit=20
 */
export const getRecentMedia = async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  logger.info(`Get recent media endpoint called with page: ${page}, limit: ${limit}`);

  try {
    // Validar parámetros
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "El parámetro 'page' debe ser un número entero mayor o igual a 1.",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "El parámetro 'limit' debe ser un número entero entre 1 y 100.",
      });
    }

    const mediaList = await reviewMediaRepository.getRecentMedia(pageNum, limitNum);

    // Formatear respuesta
    const formattedData = mediaList.map(media => ({
      id: media.id,
      filename: media.filename,
      originalFilename: media.originalFilename,
      fileSize: parseInt(media.fileSize, 10),
      mimeType: media.mimeType,
      url: `/api/media/${media.id}`,
      createdAt: media.createdAt.toISOString(),
    }));

    logger.info(`Returning ${formattedData.length} recent media items for page ${pageNum}`);

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (err) {
    logger.error(
      `Get recent media endpoint failed, error: ${err.message}, stack: ${err.stack}`
    );

    // Si es un error conocido con status
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};

/**
 * Obtiene un archivo multimedia por su ID
 * GET /api/media/:id
 */
export const getMediaFile = async (req, res, next) => {
  const { id } = req.params;

  logger.info(`Get media file endpoint called for media: ${id}`);

  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "El ID del archivo multimedia debe ser un UUID válido.",
      });
    }

    const mediaRecord = await reviewMediaRepository.findById(id);

    if (!mediaRecord) {
      return res.status(404).json({
        success: false,
        message: "Archivo multimedia no encontrado.",
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', mediaRecord.mimeType);
    res.setHeader('Content-Length', mediaRecord.fileSize);
    res.setHeader('Content-Disposition', `inline; filename="${mediaRecord.originalFilename}"`);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    logger.info(
      `Serving media file: ${id}, size: ${mediaRecord.fileSize}, type: ${mediaRecord.mimeType}`
    );

    // Send the raw file data
    res.send(mediaRecord.fileData);
  } catch (err) {
    logger.error(
      `Get media file endpoint failed for media: ${id}, error: ${err.message}, stack: ${err.stack}`
    );

    // Si es un error conocido con status
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};