import { AppDataSource } from "../load/typeorm.loader.js";
import QuestionVote from "../models/questionVote.model.js";

class QuestionVoteRepository {
  constructor() {}

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    return AppDataSource.getRepository(QuestionVote);
  }

  /**
   * Crea un nuevo voto para una pregunta
   * @param {Object} voteData - Datos del voto
   * @returns {Promise<QuestionVote>} - Voto creado
   */
  async create(voteData) {
    const vote = this.getRepository().create(voteData);
    return await this.getRepository().save(vote);
  }

  /**
   * Busca un voto por pregunta y usuario
   * @param {string} questionId - ID de la pregunta
   * @param {string} userId - ID del usuario
   * @returns {Promise<QuestionVote|null>} - Voto encontrado o null
   */
  async findByQuestionAndUser(questionId, userId) {
    return await this.getRepository().findOne({
      where: { questionId, userId },
    });
  }

  /**
   * Cuenta los votos de una pregunta
   * @param {string} questionId - ID de la pregunta
   * @returns {Promise<number>} - Número de votos
   */
  async countVotes(questionId) {
    return await this.getRepository().count({
      where: { questionId },
    });
  }

  /**
   * Elimina un voto
   * @param {string} questionId - ID de la pregunta
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} - True si se eliminó
   */
  async delete(questionId, userId) {
    const result = await this.getRepository().delete({
      questionId,
      userId,
    });
    return result.affected > 0;
  }

  /**
   * Verifica si un usuario votó por una pregunta
   * @param {string} questionId - ID de la pregunta
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} - True si votó
   */
  async hasUserVoted(questionId, userId) {
    const count = await this.getRepository().count({
      where: { questionId, userId },
    });
    return count > 0;
  }
}

export default QuestionVoteRepository;