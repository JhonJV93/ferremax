import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface TokenPayload {
  userId: string;
  role: string;
  organizationId?: string | null; // ✅ Acepta null y undefined
}

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES as jwt.SignOptions['expiresIn'] }
  );
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES as jwt.SignOptions['expiresIn'] }
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};