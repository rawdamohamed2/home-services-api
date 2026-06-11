import jwt from "jsonwebtoken";

export const generateToken = (userId, role) => {
  const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE },
  );

  return { token, refreshToken };
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
