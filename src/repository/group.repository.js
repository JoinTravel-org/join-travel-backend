import { AppDataSource } from "../load/typeorm.loader.js";
import Group from "../models/group.model.js";

class GroupRepository {
  getRepository() {
    return AppDataSource.getRepository(Group);
  }

  /**
   * Creates a new group and assigns the creator as admin and member
   * @param {Object} groupData - Group data (name, description, adminId)
   * @returns {Promise<Group>} The created group with relations loaded
   */
  async create(groupData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create and save the group (adminId is required in groupData)
      const group = this.getRepository().create(groupData);
      const savedGroup = await queryRunner.manager.save(Group, group);

      // Add the admin as a member in the join table
      await queryRunner.query(
        `INSERT INTO group_members ("groupId", "userId") VALUES ($1, $2)`,
        [savedGroup.id, groupData.adminId]
      );

      await queryRunner.commitTransaction();

      // Return the group with relations loaded
      return await this.getRepository().findOne({
        where: { id: savedGroup.id },
        relations: ["admin", "members"]
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error creating group: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Finds a group by its name
   */
  async findByNameAndId(name) {
    return await this.getRepository().findOne({ where: { name } });
  }

  /**
   * Finds a group by its ID, including admin and members
   */
  async findById(id) {
    return await this.getRepository().findOne({
      where: { id },
      relations: ["admin", "members"]
    });
  }

  /**
   * Finds all groups for a user (as admin or member)
   */
  async findByUserId(userId) {
    return await this.getRepository()
      .createQueryBuilder("group")
      .leftJoinAndSelect("group.admin", "admin")
      .leftJoinAndSelect("group.members", "members")
      .where("group.adminId = :userId", { userId })
      .orWhere("members.id = :userId", { userId })
      .getMany();
  }

  /**
   * Adds members to a group
   */
  async addMembers(groupId, userIds) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const userId of userIds) {
        await queryRunner.query(
          `INSERT INTO group_members ("groupId", "userId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [groupId, userId]
        );
      }
      await queryRunner.commitTransaction();
      return await this.findById(groupId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error adding members: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Removes a member from a group
   */
  async removeMember(groupId, userId) {
    await AppDataSource
      .createQueryBuilder()
      .delete()
      .from("group_members")
      .where('"groupId" = :groupId AND "userId" = :userId', { groupId, userId })
      .execute();
    return await this.findById(groupId);
  }
}

export default new GroupRepository();