import answerService from "../services/answer.service.js";
import logger from "../config/logger.js";

/**
 * Crea una nueva respuesta
 * POST /api/questions/:questionId/answers
 * Body: { content }
 */
export const createAnswer = async (req, res, next) => {
  logger.info(`Create answer endpoint called for question: ${req.params.questionId}, user: ${req.user.id}`);
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "ID de la pregunta es requerido.",
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "El contenido de la respuesta es requerido.",
      });
    }

    const result = await answerService.createAnswer({
      questionId,
      userId,
      content,
    });

    logger.info(`Create answer endpoint completed successfully: ${result.id}`);
    res.status(201).json({
      success: true,
      data: result,
      message: "Respuesta creada exitosamente.",
    });
  } catch (err) {
    logger.error(`Create answer endpoint failed: ${err.message}`);
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
 * Obtiene respuestas de una pregunta
 * GET /api/questions/:questionId/answers
 */
export const getAnswersByQuestion = async (req, res, next) => {
  logger.info(`Get answers by question endpoint called for question: ${req.params.questionId}`);
  try {
    const { questionId } = req.params;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "ID de la pregunta es requerido.",
      });
    }

    const answers = await answerService.getAnswersByQuestion(questionId);

    logger.info(`Get answers by question endpoint completed successfully, returned ${answers.length} answers`);
    res.status(200).json({
      success: true,
      data: answers,
    });
  } catch (err) {
    logger.error(`Get answers by question endpoint failed: ${err.message}`);
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
 * Vota por una respuesta
 * POST /api/answers/:answerId/vote
 */
export const voteAnswer = async (req, res, next) => {
  logger.info(`Vote answer endpoint called for answer: ${req.params.answerId}, user: ${req.user.id}`);
  try {
    const { answerId } = req.params;
    const userId = req.user.id;

    if (!answerId) {
      return res.status(400).json({
        success: false,
        message: "ID de la respuesta es requerido.",
      });
    }

    const result = await answerService.voteAnswer(answerId, userId);

    logger.info(`Vote answer endpoint completed successfully for answer: ${answerId}`);
    res.status(200).json({
      success: true,
      data: result,
      message: result.voted ? "Voto agregado." : "Voto removido.",
    });
  } catch (err) {
    logger.error(`Vote answer endpoint failed: ${err.message}`);
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
 * Obtiene el estado del voto de un usuario para una respuesta
 * GET /api/answers/:answerId/vote
 */
export const getAnswerVoteStatus = async (req, res, next) => {
  logger.info(`Get answer vote status endpoint called for answer: ${req.params.answerId}, user: ${req.user.id}`);
  try {
    const { answerId } = req.params;
    const userId = req.user.id;

    if (!answerId) {
      return res.status(400).json({
        success: false,
        message: "ID de la respuesta es requerido.",
      });
    }

    const result = await answerService.getVoteStatus(answerId, userId);

    logger.info(`Get answer vote status endpoint completed successfully for answer: ${answerId}`);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error(`Get answer vote status endpoint failed: ${err.message}`);
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};