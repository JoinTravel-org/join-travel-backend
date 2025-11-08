import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "GroupMessage",
  tableName: "group_messages",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    groupId: {
      type: "uuid",
      nullable: false,
      comment: "ID del grupo al que pertenece el mensaje",
    },
    senderId: {
      type: "uuid",
      nullable: false,
      comment: "ID del usuario que envió el mensaje",
    },
    content: {
      type: "text",
      nullable: false,
      comment: "Contenido del mensaje",
    },
    createdAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    updatedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    group: {
      target: "Group",
      type: "many-to-one",
      joinColumn: {
        name: "groupId",
      },
      onDelete: "CASCADE",
    },
    sender: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "senderId",
      },
    },
  },
  indices: [
    {
      name: "IDX_GROUP_MESSAGE_GROUP_ID",
      columns: ["groupId"],
    },
    {
      name: "IDX_GROUP_MESSAGE_SENDER_ID",
      columns: ["senderId"],
    },
    {
      name: "IDX_GROUP_MESSAGE_CREATED_AT",
      columns: ["createdAt"],
    },
  ],
});
