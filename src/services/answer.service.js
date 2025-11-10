import AnswerRepository from "../repository/answer.repository.js";
import AnswerVoteRepository from "../repository/answerVote.repository.js";
import logger from "../config/logger.js";

class AnswerService {
  constructor() {
    this.answerRepository = new AnswerRepository();
    this.answerVoteRepository = new AnswerVoteRepository();
  }

  /**
   * Crea una nueva respuesta
   * @param {Object} answerData - { questionId, userId, content }
   * @returns {Promise<Object>} - Respuesta creada
   */
  async createAnswer({ questionId, userId, content }) {
    try {
      // Validar datos requeridos
      if (!questionId || !userId || !content) {
        const error = new Error("questionId, userId y content son requeridos");
        error.status = 400;
        throw error;
      }

      // Validar longitud del contenido
      if (content.trim().length < 10 || content.trim().length > 1000) {
        const error = new Error("El contenido debe tener entre 10 y 1000 caracteres");
        error.status = 400;
        throw error;
      }

      // Allow multiple answers per user per question - removed restriction

      const answer = await this.answerRepository.create({
        questionId,
        userId,
        content: content.trim(),
      });

      logger.info(`Answer created: ${answer.id} by user ${userId} for question ${questionId}`);

      return {
        id: answer.id,
        questionId: answer.questionId,
        userId: answer.userId,
        content: answer.content,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        user: answer.user ? {
          id: answer.user.id,
          email: answer.user.email,
        } : null,
        question: answer.question ? {
          id: answer.question.id,
          content: answer.question.content,
        } : null,
        voteCount: 0,
      };
    } catch (error) {
      logger.error(`Error creating answer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene respuestas de una pregunta
   * @param {string} questionId - ID de la pregunta
   * @returns {Promise<Array>} - Lista de respuestas
   */
  async getAnswersByQuestion(questionId) {
    try {
      if (!questionId) {
        const error = new Error("questionId es requerido");
        error.status = 400;
        throw error;
      }

      const answers = await this.answerRepository.findByQuestionId(questionId);

      // Procesar el resultado para incluir información del usuario
      const answersWithUserInfo = answers.map((answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        userId: answer.userId,
        content: answer.content,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        user: answer.user ? {
          id: answer.user.id,
          email: answer.user.email,
        } : null,
        question: answer.question ? {
          id: answer.question.id,
          content: answer.question.content,
        } : null,
        voteCount: answer.voteCount || 0,
      }));

      logger.info(`Retrieved ${answersWithUserInfo.length} answers for question ${questionId}`);

      return answersWithUserInfo;
    } catch (error) {
      logger.error(`Error getting answers for question ${questionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vota por una respuesta
   * @param {string} answerId - ID de la respuesta
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado del voto
   */
  async voteAnswer(answerId, userId) {
    try {
      if (!answerId || !userId) {
        const error = new Error("answerId y userId son requeridos");
        error.status = 400;
        throw error;
      }

      // Verificar que la respuesta existe
      const answer = await this.answerRepository.findById(answerId);
      if (!answer) {
        const error = new Error("Respuesta no encontrada");
        error.status = 404;
        throw error;
      }

      // Verificar si el usuario ya votó
      const hasVoted = await this.answerVoteRepository.hasUserVoted(answerId, userId);

      if (hasVoted) {
        // Remover voto
        await this.answerVoteRepository.delete(answerId, userId);
        const voteCount = await this.answerVoteRepository.countVotes(answerId);

        logger.info(`User ${userId} removed vote from answer ${answerId}`);

        return {
          voted: false,
          voteCount,
        };
      } else {
        // Agregar voto
        await this.answerVoteRepository.create({
          answerId,
          userId,
        });
        const voteCount = await this.answerVoteRepository.countVotes(answerId);

        logger.info(`User ${userId} voted for answer ${answerId}`);

        return {
          voted: true,
          voteCount,
        };
      }
    } catch (error) {
      logger.error(`Error voting answer ${answerId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el estado del voto de un usuario para una respuesta
   * @param {string} answerId - ID de la respuesta
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Estado del voto
   */
  async getVoteStatus(answerId, userId) {
    try {
      if (!answerId || !userId) {
        const error = new Error("answerId y userId son requeridos");
        error.status = 400;
        throw error;
      }

      const hasVoted = await this.answerVoteRepository.hasUserVoted(answerId, userId);
      const voteCount = await this.answerVoteRepository.countVotes(answerId);

      return {
        hasVoted,
        voteCount,
      };
    } catch (error) {
      logger.error(`Error getting vote status for answer ${answerId}: ${error.message}`);
      throw error;
    }
  }
}

export default new AnswerService();