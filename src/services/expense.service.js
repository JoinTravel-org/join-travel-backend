import { AppDataSource } from "../load/typeorm.loader.js";
import Expense from "../models/expense.model.js";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "../utils/customErrors.js";

const expenseRepository = AppDataSource.getRepository(Expense);
const groupRepository = AppDataSource.getRepository(Group);
const userRepository = AppDataSource.getRepository(User);

export const createExpense = async (expenseData, userId) => {
  const { concept, amount, groupId } = expenseData;

  // Validate input
  if (!concept || typeof concept !== "string" || concept.trim().length === 0) {
    throw new ValidationError(
      "Concept is required and must be a non-empty string"
    );
  }

  if (concept.length > 100) {
    throw new ValidationError("Concept must be 100 characters or less");
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    throw new ValidationError("Amount must be a positive number");
  }

  // Validate amount format and precision
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    throw new ValidationError("Amount must be a valid number");
  }

  // Check for excessive decimal places (more than 2)
  if (amount.includes(".") && amount.split(".")[1].length > 2) {
    throw new ValidationError("Amount can have at most 2 decimal places");
  }

  // Convert amount to cents for storage to avoid floating point issues
  const amountInCents = Math.round(numAmount * 100);

  if (amountInCents < 1 || amountInCents > 999999999) {
    // Min 0.01, Max 9,999,999.99
    throw new ValidationError("Amount must be between 0.01 and 9,999,999.99");
  }

  // Check if group exists and user is a member
  const group = await groupRepository.findOne({
    where: { id: groupId },
    relations: ["members"],
  });

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const isMember =
    group.members.some((member) => member.id === userId) ||
    group.adminId === userId;
  if (!isMember) {
    throw new AuthorizationError(
      "You must be a member of the group to add expenses"
    );
  }

  // Create expense without paidById
  const expense = expenseRepository.create({
    concept: concept.trim(),
    amount: amountInCents, // Store as cents
    groupId,
    userId,
    paidById: null,
  });

  await expenseRepository.save(expense);

  // Award points for creating expense
  try {
    const gamificationService = (
      await import("../services/gamification.service.js")
    ).default;
    await gamificationService.awardPoints(userId, "expense_created", {
      expenseId: expense.id,
      groupId: expense.groupId,
      amount: expense.amount,
    });
  } catch (gamificationError) {
    // Log error but don't fail expense creation
    console.error(
      "Failed to award points for expense creation:",
      gamificationError
    );
  }

  // Return expense with amount converted back to decimal
  return {
    ...expense,
    amount: (expense.amount / 100).toFixed(2),
  };
};

export const getGroupExpenses = async (groupId, userId) => {
  let expenses;

  if (groupId) {
    // Check if group exists and user is a member
    const group = await groupRepository.findOne({
      where: { id: groupId },
      relations: ["members"],
    });

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const isMember =
      group.members.some((member) => member.id === userId) ||
      group.adminId === userId;
    if (!isMember) {
      throw new AuthorizationError(
        "You must be a member of the group to view expenses"
      );
    }

    // Get expenses for specific group
    expenses = await expenseRepository.find({
      where: { groupId },
      relations: ["user", "paidBy"],
      order: { createdAt: "DESC" },
    });
  } else {
    // Get all expenses for the user across all groups
    expenses = await expenseRepository.find({
      where: { userId },
      relations: ["user", "group", "paidBy"],
      order: { createdAt: "DESC" },
    });
  }

  // Convert amounts back to decimal and calculate total
  const expensesWithDecimal = expenses.map((expense) => ({
    ...expense,
    amount: (expense.amount / 100).toFixed(2),
  }));

  // Calculate total using cents to avoid floating point precision issues
  const totalInCents = expenses.reduce((sum, expense) => {
    let amount = expense.amount;

    // Convert string amounts to numbers if needed (database issue)
    if (typeof amount === "string") {
      amount = parseFloat(amount);
    }

    // Validate each amount before summing
    if (typeof amount !== "number" || isNaN(amount) || !isFinite(amount)) {
      console.error("Invalid expense amount detected:", {
        expenseId: expense.id,
        originalAmount: expense.amount,
        convertedAmount: amount,
        type: typeof expense.amount,
      });
      return sum; // Skip invalid amounts
    }
    return sum + amount;
  }, 0);

  const total = totalInCents / 100;

  // Final validation of total
  if (isNaN(total) || !isFinite(total)) {
    console.error("Invalid total calculation:", {
      totalInCents,
      total,
      expenseCount: expenses.length,
      expenses: expenses.map((e) => ({ id: e.id, amount: e.amount })),
    });
    // Return 0 instead of NaN to prevent frontend issues
    return {
      expenses: expensesWithDecimal,
      total: "0.00",
    };
  }

  return {
    expenses: expensesWithDecimal,
    total: total.toFixed(2),
  };
};

export const deleteExpense = async (expenseId, userId) => {
  const expense = await expenseRepository.findOne({
    where: { id: expenseId },
    relations: ["group"],
  });

  if (!expense) {
    throw new NotFoundError("Expense not found");
  }

  // Only the expense creator or group admin can delete
  if (expense.userId !== userId && expense.group.adminId !== userId) {
    throw new AuthorizationError(
      "You can only delete your own expenses or be the group admin"
    );
  }

  await expenseRepository.remove(expense);
  return { message: "Expense deleted successfully" };
};

export const assignExpense = async (expenseId, paidById, userId) => {
  // Get expense with group and members
  const expense = await expenseRepository.findOne({
    where: { id: expenseId },
    relations: ["group", "group.members"],
  });

  if (!expense) {
    throw new NotFoundError("Expense not found");
  }

  // Only group admin can assign expenses
  if (expense.group.adminId !== userId) {
    throw new AuthorizationError(
      "Only the group admin can assign expenses to members"
    );
  }

  // Validate that paidById is a member of the group
  const isPaidByMember =
    expense.group.members.some((member) => member.id === paidById) ||
    expense.group.adminId === paidById;

  if (!isPaidByMember) {
    throw new ValidationError("Usuario inválido.");
  }

  // Update expense
  expense.paidById = paidById;
  await expenseRepository.save(expense);

  // Load paidBy relation for response
  const updatedExpense = await expenseRepository.findOne({
    where: { id: expenseId },
    relations: ["user", "paidBy"],
  });

  return {
    ...updatedExpense,
    amount: (updatedExpense.amount / 100).toFixed(2),
  };
};

export default {
  createExpense,
  getGroupExpenses,
  deleteExpense,
  assignExpense,
};
