import jwt from "jsonwebtoken";

export const createAccessToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" }
  );
};

export const createRefreshToken = (user: any) => {
  
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );
};


export const verifyToken = (token: string, type: "access" | "refresh") => {
  const secret =
    type === "access"
      ? process.env.JWT_ACCESS_SECRET
      : process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error(`${type.toUpperCase()}_SECRET not defined`);
  return jwt.verify(token, secret) as { id: string };
};
