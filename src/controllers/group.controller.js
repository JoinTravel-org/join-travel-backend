import groupService from "../services/group.service.js";
import logger from "../config/logger.js";

/**
 * Creates a new group
 * POST /api/groups
 */
export const createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const adminId = req.user.id;

    const result = await groupService.createGroup({ name, description, adminId });
    res.status(201).json(result);
  } catch (err) {
    logger.error(`Create group failed: ${err.message}`);
    if (err.status === 409) {
      return res.status(409).json({ success: false, message: err.message });
    }
    if (err.status === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Gets all groups for the current user
 * GET /api/groups
 */
export const getUserGroups = async (req, res, next) => {
  try {
    const result = await groupService.getUserGroups(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Get user groups failed: ${err.message}`);
    next(err);
  }
};

/**
 * Gets a specific group by ID
 * GET /api/groups/:id
 */
export const getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await groupService.getGroupById(id);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Get group by ID failed: ${err.message}`);
    if (err.status === 404) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Adds members to a group
 * POST /api/groups/:id/members
 */
export const addMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    const requesterId = req.user.id;

    const result = await groupService.addMembers(id, userIds, requesterId);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Add members failed: ${err.message}`);
    if (err.status === 403) {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.status === 404) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Removes a member from a group
 * DELETE /api/groups/:groupId/members/:userId
 */
export const removeMember = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;
    const requesterId = req.user.id;

    const result = await groupService.removeMember(groupId, userId, requesterId);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Remove member failed: ${err.message}`);
    if (err.status === 403 || err.status === 400) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    if (err.status === 404) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};


export const removeGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    const result = await groupService.removeGroup(id, requesterId);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Remove group failed: ${err.message}`);
    if (err.status === 403) {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.status === 404) {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.status === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Assigns an itinerary to a group
 * POST /api/groups/:id/itinerary
 */
export const assignItinerary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itineraryId } = req.body;
    const requesterId = req.user.id;

    const result = await groupService.assignItinerary(id, itineraryId, requesterId);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Assign itinerary failed: ${err.message}`);
    if (err.status === 403 || err.status === 400 || err.status === 404) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Removes the assigned itinerary from a group
 * DELETE /api/groups/:id/itinerary
 */
export const removeItinerary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    const result = await groupService.removeItinerary(id, requesterId);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Remove itinerary failed: ${err.message}`);
    if (err.status === 403 || err.status === 400 || err.status === 404) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

export default {
  createGroup,
  getUserGroups,
  getGroupById,
  addMembers,
  removeGroup,
  removeMember,
  assignItinerary,
  removeItinerary,
};