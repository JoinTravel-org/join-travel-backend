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
  async findByName(name) {
    return await this.getRepository().findOne({ where: { name } });
  }

  /**
   * Finds a group by its ID, including admin and members
   */
  async findById(id) {
    return await this.getRepository().findOne({
      where: { id },
      relations: ["admin", "members", "assignedItinerary", "assignedItinerary.items", "assignedItinerary.items.place"]
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
      .leftJoinAndSelect("group.assignedItinerary", "assignedItinerary")
      .leftJoinAndSelect("assignedItinerary.items", "items")
      .leftJoinAndSelect("items.place", "place")
      .where("group.adminId = :userId", { userId })
      .orWhere("members.id = :userId", { userId })
      .getMany();
  }

  /**
   * Assigns an itinerary to a group
   * @param {string} groupId - Group ID
   * @param {string} itineraryId - Itinerary ID
   * @returns {Promise<Group>} Updated group
   */
  async assignItinerary(groupId, itineraryId) {
    await this.getRepository().update(groupId, { assignedItineraryId: itineraryId });
    return await this.findById(groupId);
  }

  /**
   * Removes the assigned itinerary from a group
   * @param {string} groupId - Group ID
   * @returns {Promise<Group>} Updated group
   */
  async removeItinerary(groupId) {
    await this.getRepository().update(groupId, { assignedItineraryId: null });
    return await this.findById(groupId);
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

  /**
   * Deletes a group and its member relations and associated expenses, returns the deleted group data
   */
  async delete(groupId) {
    const groupToDelete = await this.findById(groupId);
    if (!groupToDelete) {
      throw new Error(`Group with id ${groupId} not found`);
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete associated expenses first (cascade delete)
      await queryRunner.query(`DELETE FROM expenses WHERE "groupId" = $1`, [groupId]);

      // Remove join table entries
      await queryRunner.query(`DELETE FROM group_members WHERE "groupId" = $1`, [groupId]);

      // Delete the group
      await queryRunner.manager.delete(Group, groupId);

      await queryRunner.commitTransaction();
      return groupToDelete;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error deleting group: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}

export default new GroupRepository();