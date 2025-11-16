import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "UserFollower",
  tableName: "user_followers",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    followerId: {
      type: "uuid",
      nullable: false,
    },
    followedId: {
      type: "uuid",
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    follower: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "followerId",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
    followed: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "followedId",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_FOLLOWER_FOLLOWED",
      columns: ["followerId", "followedId"],
      unique: true,
    },
    {
      name: "IDX_FOLLOWER",
      columns: ["followerId"],
    },
    {
      name: "IDX_FOLLOWED",
      columns: ["followedId"],
    },
  ],
});
