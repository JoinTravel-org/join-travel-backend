import expenseService from "../services/expense.service.js";

export const createExpense = async (req, res, next) => {
  try {
    const { concept, amount, paidById } = req.body;
    const { groupId } = req.params;
    const userId = req.user.id;

    const expense = await expenseService.createExpense(
      { concept, amount, groupId, paidById },
      userId
    );

    res.status(201).json({
      success: true,
      data: expense,
      message: "Expense created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupExpenses = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const result = await expenseService.getGroupExpenses(groupId, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;

    const result = await expenseService.deleteExpense(expenseId, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createExpense,
  getGroupExpenses,
  deleteExpense,
};
