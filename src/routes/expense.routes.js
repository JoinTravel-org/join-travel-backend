import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import expenseController from "../controllers/expense.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management endpoints
 */

/**
 * @swagger
 * /api/groups/{groupId}/expenses:
 *   post:
 *     summary: Create a new expense for a group
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - concept
 *               - amount
 *             properties:
 *               concept:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 9999999.99
 *     responses:
 *       201:
 *         description: Expense created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.post(
  "/groups/:groupId/expenses",
  authenticate,
  expenseController.createExpense
);

/**
 * @swagger
 * /api/groups/{groupId}/expenses:
 *   get:
 *     summary: Get all expenses for a group
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of expenses retrieved successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.get(
  "/groups/:groupId/expenses",
  authenticate,
  expenseController.getGroupExpenses
);

/**
 * @swagger
 * /api/expenses/user:
 *   get:
 *     summary: Get all expenses for the current user across all groups
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all user expenses retrieved successfully
 *       403:
 *         description: Not authorized
 */
router.get("/expenses/user", authenticate, expenseController.getUserExpenses);

/**
 * @swagger
 * /api/expenses/{expenseId}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Expense not found
 */
router.delete(
  "/expenses/:expenseId",
  authenticate,
  expenseController.deleteExpense
);

/**
 * @swagger
 * /api/expenses/{expenseId}/assign:
 *   patch:
 *     summary: Assign an expense to a group member (admin only)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paidById
 *             properties:
 *               paidById:
 *                 type: string
 *                 description: ID of the user who paid for the expense
 *     responses:
 *       200:
 *         description: Expense assigned successfully
 *       400:
 *         description: Invalid user ID
 *       403:
 *         description: Not authorized (only group admin)
 *       404:
 *         description: Expense not found
 */
router.patch(
  "/expenses/:expenseId/assign",
  authenticate,
  expenseController.assignExpense
);

export default router;
