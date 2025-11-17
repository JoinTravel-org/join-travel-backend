import groupRepository from "../repository/group.repository.js";
import itineraryRepository from "../repository/itinerary.repository.js";
import UserRepository from "../repository/user.repository.js";
import logger from "../config/logger.js";
import { createAndEmitNotification } from "../socket/notification.emitter.js";

class GroupService {
  constructor() {
    this.userRepository = new UserRepository();
  }
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

      // Send notifications to newly added members
      try {
        const admin = group.members.find((m) => m.id === requesterId);

        logger.info(
          `[Group Service] Sending notifications to ${userIds.length} new members`
        );

        for (const userId of userIds) {
          logger.info(
            `[Group Service] Sending GROUP_INVITE notification to: ${userId}`
          );
          await createAndEmitNotification({
            userId: userId,
            type: "GROUP_INVITE",
            title: `Invitación a grupo`,
            message: `${admin?.email || "Alguien"} te ha agregado al grupo "${
              group.name
            }"`,
            data: {
              groupId,
              groupName: group.name,
              adminId: requesterId,
              adminEmail: admin?.email,
            },
          });
        }

        logger.info(
          `[Group Service] ✓ All member invitation notifications sent`
        );
      } catch (notifError) {
        logger.error(
          `[Group Service] ✗ Error sending notifications for new members: ${notifError.message}`,
          notifError
        );
        // Don't fail the add members if notifications fail
      }

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

  /**
   * Assigns an itinerary to a group
   * @param {string} groupId
   * @param {string} itineraryId
   * @param {string} requesterId
   * @returns {Promise<Object>} - { success, data, message }
   */
  async assignItinerary(groupId, itineraryId, requesterId) {
    try {
      // Validate group exists
      const group = await groupRepository.findById(groupId);
      if (!group) {
        const error = new Error("Grupo no encontrado");
        error.status = 404;
        throw error;
      }

      // Validate requester is admin
      if (group.adminId !== requesterId) {
        const error = new Error(
          "Solo el administrador puede asignar itinerarios"
        );
        error.status = 403;
        throw error;
      }

      // Validate group has members (besides admin)
      if (!group.members || group.members.length <= 1) {
        const error = new Error("No hay miembros para asignar.");
        error.status = 400;
        throw error;
      }

      // Validate itinerary exists and belongs to requester
      const itinerary = await itineraryRepository.getItineraryById(itineraryId);
      if (!itinerary) {
        const error = new Error("Itinerario no encontrado");
        error.status = 404;
        throw error;
      }

      if (itinerary.userId !== requesterId) {
        const error = new Error("Solo puedes asignar tus propios itinerarios");
        error.status = 403;
        throw error;
      }

      // Validate itinerary has items
      if (!itinerary.items || itinerary.items.length === 0) {
        const error = new Error("No se puede asignar un itinerario vacío");
        error.status = 400;
        throw error;
      }

      // Assign itinerary
      const updatedGroup = await groupRepository.assignItinerary(
        groupId,
        itineraryId
      );

      // Send notifications to all members (except admin)
      try {
        const admin = group.members.find((m) => m.id === requesterId);
        const otherMembers = group.members.filter((m) => m.id !== requesterId);

        for (const member of otherMembers) {
          await createAndEmitNotification({
            userId: member.id,
            type: "NEW_ITINERARY",
            title: `Nuevo itinerario en ${group.name}`,
            message: `${
              admin?.email || "El administrador"
            } ha asignado el itinerario "${itinerary.name}"`,
            data: {
              groupId,
              groupName: group.name,
              itineraryId,
              itineraryName: itinerary.name,
              adminId: requesterId,
              adminEmail: admin?.email,
            },
          });
        }
      } catch (notifError) {
        logger.error(
          `Error sending notifications for itinerary assignment: ${notifError.message}`
        );
        // Don't fail the assignment if notifications fail
      }

      logger.info(
        `Itinerary ${itineraryId} assigned to group ${groupId} by user ${requesterId}`
      );
      return {
        success: true,
        data: updatedGroup,
        message: "Itinerario asignado exitosamente",
      };
    } catch (err) {
      logger.error(
        `Error assigning itinerary to group ${groupId}: ${err.message}`
      );
      throw err;
    }
  }

  /**
   * Removes the assigned itinerary from a group
   * @param {string} groupId
   * @param {string} requesterId
   * @returns {Promise<Object>} - { success, data, message }
   */
  async removeItinerary(groupId, requesterId) {
    try {
      const group = await groupRepository.findById(groupId);
      if (!group) {
        const error = new Error("Grupo no encontrado");
        error.status = 404;
        throw error;
      }

      if (group.adminId !== requesterId) {
        const error = new Error(
          "Solo el administrador puede desasignar itinerarios"
        );
        error.status = 403;
        throw error;
      }

      if (!group.assignedItineraryId) {
        const error = new Error("El grupo no tiene un itinerario asignado");
        error.status = 400;
        throw error;
      }

      const updatedGroup = await groupRepository.removeItinerary(groupId);
      logger.info(`Itinerary removed from group ${groupId}`);
      return {
        success: true,
        data: updatedGroup,
        message: "Itinerario desasignado exitosamente",
      };
    } catch (err) {
      logger.error(
        `Error removing itinerary from group ${groupId}: ${err.message}`
      );
      throw err;
    }
  }
}

export default new GroupService();
