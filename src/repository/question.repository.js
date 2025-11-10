import { AppDataSource } from "../load/typeorm.loader.js";
import Question from "../models/question.model.js";

class QuestionRepository {
  constructor() {}

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    return AppDataSource.getRepository(Question);
  }

  /**
   * Crea una nueva pregunta
   * @param {Object} questionData - Datos de la pregunta
   * @returns {Promise<Question>} - Pregunta creada
   */
  async create(questionData) {
    const question = this.getRepository().create(questionData);
    return await this.getRepository().save(question);
  }

  /**
   * Busca una pregunta por ID
   * @param {string} id - ID de la pregunta
   * @returns {Promise<Question|null>} - Pregunta encontrada o null
   */
  async findById(id) {
    return await this.getRepository().findOne({
      where: { id },
      relations: ["user", "place"],
    });
  }

  /**
   * Obtiene todas las preguntas de un lugar ordenadas por votos y fecha
   * @param {string} placeId - ID del lugar
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Question[]>} - Lista de preguntas
   */
  async findByPlaceId(placeId, limit = 50, offset = 0) {
    const result = await this.getRepository()
      .createQueryBuilder("question")
      .leftJoinAndSelect("question.user", "user")
      .leftJoinAndSelect("question.place", "place")
      .leftJoin("question.questionVotes", "vote")
      .where("question.placeId = :placeId", { placeId })
      .addSelect("COUNT(vote.id)", "voteCount")
      .groupBy("question.id")
      .addGroupBy("user.id")
      .addGroupBy("place.id")
      .orderBy("COUNT(vote.id)", "DESC")
      .addOrderBy("question.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getRawAndEntities();

    // Transform the result to include voteCount in the entities
    result.entities.forEach((entity, index) => {
      entity.voteCount = parseInt(result.raw[index].voteCount) || 0;
    });

    return result.entities;
  }

  /**
   * Actualiza una pregunta
   * @param {string} id - ID de la pregunta
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Question>} - Pregunta actualizada
   */
  async update(id, updateData) {
    await this.getRepository().update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Elimina una pregunta
   * @param {string} id - ID de la pregunta
   * @returns {Promise<boolean>} - True si se eliminó
   */
  async delete(id) {
    const result = await this.getRepository().delete(id);
    return result.affected > 0;
  }

  /**
   * Verifica si un usuario ya preguntó sobre un lugar
   * @param {string} userId - ID del usuario
   * @param {string} placeId - ID del lugar
   * @returns {Promise<boolean>} - True si ya preguntó
   */
  async hasUserAsked(userId, placeId) {
    const count = await this.getRepository().count({
      where: { userId, placeId },
    });
    return count > 0;
  }
}

export default QuestionRepository;