/**
 * Copyright (C) 2024 [TSEI]
 *
 * Created on 2024-09-23 :: 12:52 BY andrek
 */
import { NextFunction, Request, Response } from "express";
import { verifyToken, JwtPayload } from "../services/jwtService";
import models from "../config/db";
import { AuthenticatedRequest } from "./authMiddleware";

export function checkUserHasRole(rolename: string) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized, no user found" });
    }

    try {
      //Check if user has the Admiral role
      const admiralRole = await models.role.findOne({
        where: { rolename: "Admiral" },
      });
      const isAdmiral = await models.user_role_customer.findOne({
        where: {
          userid: user.id,
          roleid: admiralRole.roleid,
          customerid: user.customerid,
        },
      });

      if (isAdmiral) {
        return next();
      }
      const hasCorrectRole = await models.user_role_customer.findOne({
        where: {
          userid: user.id,
          roleid: (await models.role.findOne({ where: { rolename } })).roleid,
          customerid: user.customerid,
        },
      });
      if (!hasCorrectRole) {
        return res
          .status(403)
          .json({ message: `Forbidden, user is not an ${rolename}` });
      }

      next();
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Server error while checking role" });
    }
  };
}
