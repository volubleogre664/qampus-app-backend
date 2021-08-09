import jwt from "jsonwebtoken";
import pkg from "apollo-server";
const { AuthenticationError } = pkg;

const SECRET_KEY = process.env.SECRET_KEY;

export default function checkAuth(context) {
  const authHeader = context.req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split("Bearer ")[1];
    if (token) {
      try {
        const user = jwt.verify(token, SECRET_KEY);
        return user;
      } catch (err) {
        throw new AuthenticationError("Invalid/Eexpired token");
      }
    }

    throw new Error("Authentication token must be 'Bearer [token]'");
  }
  throw new Error("Authorization header must be provided");
}
