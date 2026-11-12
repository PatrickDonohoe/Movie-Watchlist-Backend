import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import type { RequestHandler} from "express";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

type TokenPayload = { id: string };

const getToken = (authHeader: string | undefined, cookieToken: unknown) => {
  if (authHeader?.startsWith("Bearer ")) return authHeader.split(" ")[1];
  if (typeof cookieToken === 'string') return cookieToken;
  return undefined;
}

const verifyToken = (token: string): TokenPayload => {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new AppError("Not authorized. Invalid or expired token.", 401)
  }

  if (typeof decoded === 'string' || typeof decoded.id !== 'string') {
    throw new AppError('Not authorized. Malformed token.', 401)
  }
  return { id: decoded.id }
}

// Read the token from the request
// Check if the token is valid
export const authMiddleware: RequestHandler = async (req, _res, next) => {
  const token = getToken(req.headers.authorization, req.cookies?.jwt)
  if (!token) throw new AppError('Not authorized. No token provided.', 401);

  const { id } = verifyToken(token);

  const user = await prisma.user.findUnique({ where: { id} })
  if (!user) throw new AppError('User no longer exists', 401)

    req.user = user;
    next();

};
