import logger from "../config/logger.js";

/**
 * Obtener la clave API de Google Maps
 * GET /api/maps/key
 */
export const getMapsApiKey = (req, res) => {
  logger.info('Maps API key requested');

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      logger.error('Google Maps API key not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }

    logger.info('Maps API key successfully provided');
    res.json({
      success: true,
      apiKey: apiKey
    });
  } catch (error) {
    logger.error(`Error retrieving Google Maps API key: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API key'
    });
  }
};