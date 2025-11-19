import groupMessageRepository from "../repository/groupMessage.repository.js";
import groupRepository from "../repository/group.repository.js";
import logger from "../config/logger.js";
import { createAndEmitNotification } from "../socket/notification.emitter.js";

class GroupMessageService {
  /**
   * Envía un mensaje a un grupo
   * @param {Object} data - { groupId, senderId, content }
   * @returns {Promise<Object>} - { success, data, message }
   */
  async sendMessage({ groupId, senderId, content }) {
    try {
      // Verificar que el grupo existe
      const group = await groupRepository.findById(groupId);
      if (!group) {
        const error = new Error("El grupo ya no existe.");
        error.status = 404;
        throw error;
      }

      // Verificar que el usuario es miembro del grupo
      const isMember = group.members?.some((member) => member.id === senderId);
      if (!isMember) {
        const error = new Error("No eres miembro de este grupo");
        error.status = 403;
        throw error;
      }

      // Crear el mensaje
      const message = await groupMessageRepository.create({
        groupId,
        senderId,
        content,
      });

      logger.info(`Group message sent: ${message.id} to group ${groupId}`);

      // Enviar notificaciones a todos los miembros excepto el remitente
      try {
        const sender = group.members.find((m) => m.id === senderId);
        const otherMembers = group.members.filter((m) => m.id !== senderId);

        logger.info(
          `[Group Message] Sending notifications to ${otherMembers.length} members`
        );

        for (const member of otherMembers) {
          logger.info(
            `[Group Message] Sending notification to member: ${member.id}`
          );
          await createAndEmitNotification({
            userId: member.id,
            type: "NEW_GROUP_MESSAGE",
            title: `Nuevo mensaje en ${group.name}`,
            message: `${sender?.email || "Alguien"} ha enviado un mensaje`,
            data: {
              groupId,
              groupName: group.name,
              senderId,
              senderEmail: sender?.email,
              messageId: message.id,
            },
          });
        }
        logger.info(`[Group Message] ✓ All notifications sent successfully`);
      } catch (notifError) {
        logger.error(
          `[Group Message] ✗ Error sending notifications for group message: ${notifError.message}`,
          notifError
        );
        // Don't fail the message send if notifications fail
      }

      return {
        success: true,
        data: {
          id: message.id,
          groupId: message.groupId,
          senderId: message.senderId,
          senderEmail: message.sender?.email,
          content: message.content,
          createdAt: message.createdAt,
        },
        message: "Mensaje enviado exitosamente",
      };
    } catch (err) {
      logger.error(`Error sending group message: ${err.message}`);
      throw err;
    }
  }

  /**
   * Obtiene el historial de mensajes de un grupo
   * @param {string} groupId - ID del grupo
   * @param {string} userId - ID del usuario que solicita
   * @param {number} limit - Número de mensajes
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Object>} - { success, data }
   */
  async getGroupMessages(groupId, userId, limit = 50, offset = 0) {
    try {
      // Verificar que el grupo existe
      const group = await groupRepository.findById(groupId);
      if (!group) {
        const error = new Error("El grupo ya no existe.");
        error.status = 404;
        throw error;
      }

      // Verificar que el usuario es miembro del grupo
      const isMember = group.members?.some((member) => member.id === userId);
      if (!isMember) {
        const error = new Error("No eres miembro de este grupo");
        error.status = 403;
        throw error;
      }

      // Obtener mensajes
      const messages = await groupMessageRepository.findByGroupId(
        groupId,
        limit,
        offset
      );
      const total = await groupMessageRepository.countByGroupId(groupId);

      const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        groupId: msg.groupId,
        senderId: msg.senderId,
        senderEmail: msg.sender?.email,
        content: msg.content,
        createdAt: msg.createdAt,
      }));

      return {
        success: true,
        data: {
          messages: formattedMessages,
          total,
          hasMore: offset + messages.length < total,
        },
      };
    } catch (err) {
      logger.error(`Error getting group messages: ${err.message}`);
      throw err;
    }
  }
}

export default new GroupMessageService();
