import groupMessageService from "../services/groupMessage.service.js";
import logger from "../config/logger.js";

/**
 * Envía un mensaje a un grupo
 * POST /api/groups/:groupId/messages
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "El contenido del mensaje es requerido",
      });
    }

    const result = await groupMessageService.sendMessage({
      groupId,
      senderId,
      content: content.trim(),
    });

    res.status(201).json(result);
  } catch (err) {
    logger.error(`Send group message failed: ${err.message}`);
    if (err.status === 404) {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.status === 403) {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Obtiene el historial de mensajes de un grupo
 * GET /api/groups/:groupId/messages
 */
export const getMessages = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await groupMessageService.getGroupMessages(
      groupId,
      userId,
      limit,
      offset
    );

    res.status(200).json(result);
  } catch (err) {
    logger.error(`Get group messages failed: ${err.message}`);
    if (err.status === 404) {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.status === 403) {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
};

export default {
  sendMessage,
  getMessages,
};
