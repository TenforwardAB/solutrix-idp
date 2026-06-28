import { Request, Response, NextFunction } from "express";

/**
 * Middleware to verify admin API key for protected routes.
 * Checks for ADMIN_API_KEY in request headers.
 */

export const adminApiKeyAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers["x-admin-api-key"] || req.headers["authorization"];
  
  const adminKey = process.env.ADMIN_API_KEY;
  
  if (!adminKey) {
    res.status(500).json({ 
      error: "server_misconfigured",
      message: "Admin API key not configured" 
    });
    return;
  }
  
  if (!apiKey) {
    res.status(401).json({ 
      error: "unauthorized",
      message: "Admin API key required" 
    });
    return;
  }
  
  if (apiKey !== adminKey) {
    res.status(403).json({ 
      error: "forbidden",
      message: "Invalid admin API key" 
    });
    return;
  }
  
  next();
};