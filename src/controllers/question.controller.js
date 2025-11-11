import questionService from "../services/question.service.js";
import logger from "../config/logger.js";

/**
 * Crea una nueva pregunta
 * POST /api/places/:placeId/questions
 * Body: { content }
 */
export const createQuestion = async (req, res, next) => {
  logger.info(`Create question endpoint called for place: ${req.params.placeId}, user: ${req.user.id}`);
  try {
    const { placeId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: "ID del lugar es requerido.",
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "El contenido de la pregunta es requerido.",
      });
    }

    const result = await questionService.createQuestion({
      placeId,
      userId,
      content,
    });

    logger.info(`Create question endpoint completed successfully: ${result.id}`);
    res.status(201).json({
      success: true,
      data: result,
      message: "Pregunta creada exitosamente.",
    });
  } catch (err) {
    logger.error(`Create question endpoint failed: ${err.message}`);
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
 * Obtiene preguntas de un lugar
 * GET /api/places/:placeId/questions
 */
export const getQuestionsByPlace = async (req, res, next) => {
  logger.info(`Get questions by place endpoint called for place: ${req.params.placeId}`);
  try {
    const { placeId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: "ID del lugar es requerido.",
      });
    }

    const questions = await questionService.getQuestionsByPlace(placeId, limit, offset);

    logger.info(`Get questions by place endpoint completed successfully, returned ${questions.length} questions`);
    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (err) {
    logger.error(`Get questions by place endpoint failed: ${err.message}`);
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
 * Vota por una pregunta
 * POST /api/questions/:questionId/vote
 */
export const voteQuestion = async (req, res, next) => {
  logger.info(`Vote question endpoint called for question: ${req.params.questionId}, user: ${req.user.id}`);
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "ID de la pregunta es requerido.",
      });
    }

    const result = await questionService.voteQuestion(questionId, userId);

    logger.info(`Vote question endpoint completed successfully for question: ${questionId}`);
    res.status(200).json({
      success: true,
      data: result,
      message: result.voted ? "Voto agregado." : "Voto removido.",
    });
  } catch (err) {
    logger.error(`Vote question endpoint failed: ${err.message}`);
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
 * Obtiene el estado del voto de un usuario para una pregunta
 * GET /api/questions/:questionId/vote
 */
export const getQuestionVoteStatus = async (req, res, next) => {
  logger.info(`Get question vote status endpoint called for question: ${req.params.questionId}, user: ${req.user.id}`);
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "ID de la pregunta es requerido.",
      });
    }

    const result = await questionService.getVoteStatus(questionId, userId);

    logger.info(`Get question vote status endpoint completed successfully for question: ${questionId}`);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error(`Get question vote status endpoint failed: ${err.message}`);
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};