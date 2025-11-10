import { AppDataSource } from "../load/typeorm.loader.js";
import AnswerVote from "../models/answerVote.model.js";

class AnswerVoteRepository {
  constructor() {}

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    return AppDataSource.getRepository(AnswerVote);
  }

  /**
   * Crea un nuevo voto para una respuesta
   * @param {Object} voteData - Datos del voto
   * @returns {Promise<AnswerVote>} - Voto creado
   */
  async create(voteData) {
    const vote = this.getRepository().create(voteData);
    return await this.getRepository().save(vote);
  }

  /**
   * Busca un voto por respuesta y usuario
   * @param {string} answerId - ID de la respuesta
   * @param {string} userId - ID del usuario
   * @returns {Promise<AnswerVote|null>} - Voto encontrado o null
   */
  async findByAnswerAndUser(answerId, userId) {
    return await this.getRepository().findOne({
      where: { answerId, userId },
    });
  }

  /**
   * Cuenta los votos de una respuesta
   * @param {string} answerId - ID de la respuesta
   * @returns {Promise<number>} - Número de votos
   */
  async countVotes(answerId) {
    return await this.getRepository().count({
      where: { answerId },
    });
  }

  /**
   * Elimina un voto
   * @param {string} answerId - ID de la respuesta
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} - True si se eliminó
   */
  async delete(answerId, userId) {
    const result = await this.getRepository().delete({
      answerId,
      userId,
    });
    return result.affected > 0;
  }

  /**
   * Verifica si un usuario votó por una respuesta
   * @param {string} answerId - ID de la respuesta
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} - True si votó
   */
  async hasUserVoted(answerId, userId) {
    const count = await this.getRepository().count({
      where: { answerId, userId },
    });
    return count > 0;
  }
}

export default AnswerVoteRepository;