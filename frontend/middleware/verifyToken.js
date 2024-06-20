import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  req.user = decoded;
  next();
  } catch (err) {
  res.status(401).json({ msg: 'Token is not valid' });
}
}