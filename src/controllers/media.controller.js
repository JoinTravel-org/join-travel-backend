import reviewMediaRepository from "../repository/reviewMedia.repository.js";
import logger from "../config/logger.js";

/**
 * Obtiene un archivo multimedia por su ID
 * GET /api/media/:id
 */
export const getMediaFile = async (req, res, next) => {
  const { id } = req.params;

  logger.info(`Get media file endpoint called for media: ${id}`);

  try {
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