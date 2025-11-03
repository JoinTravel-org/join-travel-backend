import groupRepository from "../repository/group.repository.js";
import logger from "../config/logger.js";

class GroupService {
  /**
   * Creates a new group and assigns the creator as admin and member
   * @param {Object} data - { name, description, adminId }
   * @returns {Promise<Object>} - { success, data, message }
   */
  async createGroup({ name, description, adminId }) {
    try {
      if (!name || name.length < 5 || name.length > 50) {
        const error = new Error(
          "El nombre del grupo debe tener entre 5 y 50 caracteres."
        );
        error.status = 400;
        throw error;
      }
      if (!adminId) {
        const error = new Error("El ID del administrador es requerido.");
        error.status = 400;
        throw error;
      }
      // Check for duplicate group name
      const existing = await groupRepository.findByName(name);
      if (existing) {
        const error = new Error("Ya existe un grupo con ese nombre.");
        error.status = 409;
        throw error;
      }
      // Create group
      const group = await groupRepository.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        adminId,
      });
      logger.info(`Group created: ${group.id}`);
      return {
        success: true,
        data: group,
        message: "Grupo creado exitosamente",
      };
    } catch (err) {
      logger.error(`Error creating group: ${err.message}`);
      throw err;
    }
  }

  /**
   * Gets all groups for a user
   * @param {string} userId
   * @returns {Promise<Object>} - { success, data }
   */
  async getUserGroups(userId) {
    try {
      const groups = await groupRepository.findByUserId(userId);
      return {
        success: true,
        data: groups,
      };
    } catch (err) {
      logger.error(`Error getting groups for user ${userId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Gets a group by ID
   * @param {string} groupId
   * @returns {Promise<Object>} - { success, data }
   */
  async getGroupById(groupId) {
    try {
      const group = await groupRepository.findById(groupId);
      if (!group) {
        const error = new Error("Grupo no encontrado");
        error.status = 404;
        throw error;
      }
      return {
        success: true,
        data: group,
      };
    } catch (err) {
      logger.error(`Error getting group ${groupId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Adds members to a group
   * @param {string} groupId
   * @param {string[]} userIds
   * @param {string} requesterId
   * @returns {Promise<Object>} - { success, data, message }
   */
  async addMembers(groupId, userIds, requesterId) {
    try {
      const group = await groupRepository.findById(groupId);
      if (!group) {
        const error = new Error("Grupo no encontrado");
        error.status = 404;
        throw error;
      }
      if (group.adminId !== requesterId) {
        const error = new Error("Solo el administrador puede agregar miembros");
        error.status = 403;
        throw error;
      }
      const updatedGroup = await groupRepository.addMembers(groupId, userIds);
      return {
        success: true,
        data: updatedGroup,
        message: "Miembros agregados exitosamente",
      };
    } catch (err) {
      logger.error(`Error adding members to group ${groupId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Removes a member from a group
   * @param {string} groupId
   * @param {string} userId
   * @param {string} requesterId
   * @returns {Promise<Object>} - { success, data, message }
   */
  async removeMember(groupId, userId, requesterId) {
    try {
      const group = await groupRepository.findById(groupId);
      if (!group) {
        const error = new Error("Grupo no encontrado");
        error.status = 404;
        throw error;
      }
      if (group.adminId !== requesterId) {
        const error = new Error(
          "Solo el administrador puede eliminar miembros"
        );
        error.status = 403;
        throw error;
      }
      if (userId === group.adminId) {
        const error = new Error(
          "No se puede eliminar al administrador del grupo"
        );
        error.status = 400;
        throw error;
      }
      const updatedGroup = await groupRepository.removeMember(groupId, userId);
      return {
        success: true,
        data: updatedGroup,
        message: "Miembro eliminado exitosamente",
      };
    } catch (err) {
      logger.error(
        `Error removing member from group ${groupId}: ${err.message}`
      );
      throw err;
    }
  }

  /**
   * Deletes a group
   * @param {string} groupId
   * @param {string} requesterId
   * @returns {Promise<Object>} - { success, data, message }
   */
  async removeGroup(groupId, requesterId) {
    try {
      const group = await groupRepository.findById(groupId);
      if (!group) {
        const error = new Error("Grupo no encontrado");
        error.status = 404;
        throw error;
      }
      if (group.adminId !== requesterId) {
        const error = new Error(
          "Solo el administrador puede eliminar el grupo"
        );
        error.status = 403;
        throw error;
      }
      const deleted = await groupRepository.delete(groupId);
      logger.info(`Group deleted: ${groupId}`);
      return {
        success: true,
        data: deleted,
        message: "Grupo eliminado exitosamente",
      };
    } catch (err) {
      logger.error(`Error deleting group ${groupId}: ${err.message}`);
      throw err;
    }
  }
}

export default new GroupService();