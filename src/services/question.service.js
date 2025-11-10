import QuestionRepository from "../repository/question.repository.js";
import QuestionVoteRepository from "../repository/questionVote.repository.js";
import logger from "../config/logger.js";

class QuestionService {
  constructor() {
    this.questionRepository = new QuestionRepository();
    this.questionVoteRepository = new QuestionVoteRepository();
  }

  /**
   * Crea una nueva pregunta
   * @param {Object} questionData - { placeId, userId, content }
   * @returns {Promise<Object>} - Pregunta creada
   */
  async createQuestion({ placeId, userId, content }) {
    try {
      // Validar datos requeridos
      if (!placeId || !userId || !content) {
        const error = new Error("placeId, userId y content son requeridos");
        error.status = 400;
        throw error;
      }

      // Validar longitud del contenido
      if (content.trim().length < 10 || content.trim().length > 500) {
        const error = new Error("El contenido debe tener entre 10 y 500 caracteres");
        error.status = 400;
        throw error;
      }

      // Verificar que el usuario no haya preguntado ya sobre este lugar
      const hasAsked = await this.questionRepository.hasUserAsked(userId, placeId);
      if (hasAsked) {
        const error = new Error("Ya has preguntado sobre este lugar");
        error.status = 409;
        throw error;
      }

      const question = await this.questionRepository.create({
        placeId,
        userId,
        content: content.trim(),
      });

      logger.info(`Question created: ${question.id} by user ${userId} for place ${placeId}`);

      return {
        id: question.id,
        placeId: question.placeId,
        userId: question.userId,
        content: question.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        user: question.user ? {
          id: question.user.id,
          email: question.user.email,
        } : null,
        place: question.place ? {
          id: question.place.id,
          name: question.place.name,
        } : null,
        voteCount: 0,
      };
    } catch (error) {
      logger.error(`Error creating question: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene preguntas de un lugar
   * @param {string} placeId - ID del lugar
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Array>} - Lista de preguntas
   */
  async getQuestionsByPlace(placeId, limit = 50, offset = 0) {
    try {
      if (!placeId) {
        const error = new Error("placeId es requerido");
        error.status = 400;
        throw error;
      }

      const questions = await this.questionRepository.findByPlaceId(placeId, limit, offset);

      // Procesar el resultado para incluir información del usuario
      const questionsWithUserInfo = questions.map((question) => ({
        id: question.id,
        placeId: question.placeId,
        userId: question.userId,
        content: question.content,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        user: question.user ? {
          id: question.user.id,
          email: question.user.email,
        } : null,
        place: question.place ? {
          id: question.place.id,
          name: question.place.name,
        } : null,
        voteCount: question.voteCount || 0,
      }));

      logger.info(`Retrieved ${questionsWithUserInfo.length} questions for place ${placeId}`);

      return questionsWithUserInfo;
    } catch (error) {
      logger.error(`Error getting questions for place ${placeId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vota por una pregunta
   * @param {string} questionId - ID de la pregunta
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado del voto
   */
  async voteQuestion(questionId, userId) {
    try {
      if (!questionId || !userId) {
        const error = new Error("questionId y userId son requeridos");
        error.status = 400;
        throw error;
      }

      // Verificar que la pregunta existe
      const question = await this.questionRepository.findById(questionId);
      if (!question) {
        const error = new Error("Pregunta no encontrada");
        error.status = 404;
        throw error;
      }

      // Verificar si el usuario ya votó
      const hasVoted = await this.questionVoteRepository.hasUserVoted(questionId, userId);

      if (hasVoted) {
        // Remover voto
        await this.questionVoteRepository.delete(questionId, userId);
        const voteCount = await this.questionVoteRepository.countVotes(questionId);

        logger.info(`User ${userId} removed vote from question ${questionId}`);

        return {
          voted: false,
          voteCount,
        };
      } else {
        // Agregar voto
        await this.questionVoteRepository.create({
          questionId,
          userId,
        });
        const voteCount = await this.questionVoteRepository.countVotes(questionId);

        logger.info(`User ${userId} voted for question ${questionId}`);

        return {
          voted: true,
          voteCount,
        };
      }
    } catch (error) {
      logger.error(`Error voting question ${questionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el estado del voto de un usuario para una pregunta
   * @param {string} questionId - ID de la pregunta
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Estado del voto
   */
  async getVoteStatus(questionId, userId) {
    try {
      if (!questionId || !userId) {
        const error = new Error("questionId y userId son requeridos");
        error.status = 400;
        throw error;
      }

      const hasVoted = await this.questionVoteRepository.hasUserVoted(questionId, userId);
      const voteCount = await this.questionVoteRepository.countVotes(questionId);

      return {
        hasVoted,
        voteCount,
      };
    } catch (error) {
      logger.error(`Error getting vote status for question ${questionId}: ${error.message}`);
      throw error;
    }
  }
}

export default new QuestionService();