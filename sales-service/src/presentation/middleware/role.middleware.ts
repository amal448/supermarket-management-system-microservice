// src/interfaces/middlewares/role.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../../domain/entities/userEntity";

interface JwtPayload {
    id: string;
    username: string;   // ✔ add this
    role: Role;         // ✔ use Role enum/type
    branchId: string;   // ✔ add this
}

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {

      // ✅ ALLOW PREFLIGHT
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer")) {
        return res.status(401).json({ message: "No access token" });
      }

      const accessToken = authHeader.split(" ")[1];
      
      const payload = jwt.verify(
        accessToken,
        process.env.JWT_ACCESS_SECRET!
      ) as JwtPayload;

      if (!allowedRoles.includes(payload?.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid access token" });
    }
  };
};



// export const authorizeRoles = (...allowedRoles: string[]) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         try {
            
//             const token = req.cookies.refreshToken || req.headers.authorization?.split(" ")[1];
            
//             if (!token) return res.status(401).json({ message: "Unauthorized" });

//             const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
            
//             if (!allowedRoles.includes(payload.role)) {
//                 return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
//             }

//             // Attach user info to request
//             req.user = {
//                 id: payload.id,
//                 username: payload.username,
//                 role: payload.role,
//                 branchId: payload.branchId,
//             };
//             next();
//         } catch (err) {
//             console.log(err);
            
//             return res.status(401).json({ message: "Unauthorized" ,err});
//         }
//     };
// };
