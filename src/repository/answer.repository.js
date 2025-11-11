import { AppDataSource } from "../load/typeorm.loader.js";
import Answer from "../models/answer.model.js";

class AnswerRepository {
  constructor() {}

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    return AppDataSource.getRepository(Answer);
  }

  /**
   * Crea una nueva respuesta
   * @param {Object} answerData - Datos de la respuesta
   * @returns {Promise<Answer>} - Respuesta creada
   */
  async create(answerData) {
    const answer = this.getRepository().create(answerData);
    return await this.getRepository().save(answer);
  }

  /**
   * Busca una respuesta por ID
   * @param {string} id - ID de la respuesta
   * @returns {Promise<Answer|null>} - Respuesta encontrada o null
   */
  async findById(id) {
    return await this.getRepository().findOne({
      where: { id },
      relations: ["user", "question"],
    });
  }

  /**
   * Obtiene todas las respuestas de una pregunta ordenadas por votos y fecha
   * @param {string} questionId - ID de la pregunta
   * @returns {Promise<Answer[]>} - Lista de respuestas
   */
  async findByQuestionId(questionId) {
    const result = await this.getRepository()
      .createQueryBuilder("answer")
      .leftJoinAndSelect("answer.user", "user")
      .leftJoinAndSelect("answer.question", "question")
      .leftJoin("answer.answerVotes", "vote")
      .where("answer.questionId = :questionId", { questionId })
      .addSelect("COUNT(vote.id)", "voteCount")
      .groupBy("answer.id")
      .addGroupBy("user.id")
      .addGroupBy("question.id")
      .orderBy("COUNT(vote.id)", "DESC")
      .addOrderBy("answer.createdAt", "ASC")
      .getRawAndEntities();

    // Transform the result to include voteCount in the entities
    result.entities.forEach((entity, index) => {
      entity.voteCount = parseInt(result.raw[index].voteCount) || 0;
    });

    return result.entities;
  }

  /**
   * Actualiza una respuesta
   * @param {string} id - ID de la respuesta
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Answer>} - Respuesta actualizada
   */
  async update(id, updateData) {
    await this.getRepository().update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Elimina una respuesta
   * @param {string} id - ID de la respuesta
   * @returns {Promise<boolean>} - True si se eliminó
   */
  async delete(id) {
    const result = await this.getRepository().delete(id);
    return result.affected > 0;
  }

  /**
   * Verifica si un usuario ya respondió a una pregunta
   * @param {string} userId - ID del usuario
   * @param {string} questionId - ID de la pregunta
   * @returns {Promise<boolean>} - True si ya respondió
   */
  async hasUserAnswered(userId, questionId) {
    const count = await this.getRepository().count({
      where: { userId, questionId },
    });
    return count > 0;
  }
}

export default AnswerRepository;