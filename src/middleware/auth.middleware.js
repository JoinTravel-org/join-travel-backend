import jwt from "jsonwebtoken";
import { AppDataSource } from "../load/typeorm.loader.js";
import User from "../models/user.model.js";
import authService from "../services/auth.service.js";

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user information to the request object
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format."
      });
    }

    // Verify token using your JWT secret from environment
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is revoked
    const isRevoked = await authService.isTokenRevoked(token);
    if (isRevoked) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked."
      });
    }
    
    // Find user in database
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Token is invalid."
      });
    }

    // Attach user information to request object for use in subsequent middleware/controllers
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      // Add other user properties you need
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token."
      });
    }

    // Handle other types of errors
    return res.status(500).json({
      success: false,
      message: "Server error during authentication."
    });
  }
};

/**
 * Authorization Middleware
 * Checks if the authenticated user has required permissions
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions."
      });
    }

    next();
  };
};