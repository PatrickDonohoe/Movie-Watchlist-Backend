import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { clearAuthCookie, setAuthCookie } from '../utils/setAuthCookie.js';
import type {
  LoginInput,
  LoginReturn,
  RegistrationInput,
} from '../validators/authValidators.js';
import { ApiResponse } from '../types/api.js';
import { sendSuccess } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';
import { requireUser } from '../utils/requireUser.js';
import type { MessageReturn } from '../types/messageReturn.js';
import type { AppDeps } from '../app.js';
import { Prisma } from '@prisma/client';

export const createAuthController = ({ prisma }: AppDeps) => {
  const register = async (
    req: Request<{}, ApiResponse<LoginReturn>, RegistrationInput>,
    res: Response<ApiResponse<LoginReturn>>
  ) => {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        omit: { password: true },
      });
      setAuthCookie(user.id, res);
      return sendSuccess(res, { user }, 201);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002')
          throw new AppError('User already exists with that email', 'CONFLICT');
      }
      throw err;
    }
  };

  const login = async (
    req: Request<{}, ApiResponse<LoginReturn>, LoginInput>,
    res: Response<ApiResponse<LoginReturn>>
  ) => {
    const { email, password } = req.body;

    // Check if user email exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Invalid email or password', 'UNAUTHORIZED');
    }

    // Generate jwt token
    setAuthCookie(user.id, res);

    return sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  };

  const logout = async (
    _req: Request,
    res: Response<ApiResponse<MessageReturn>>
  ) => {
    clearAuthCookie(res);
    sendSuccess(res, { message: 'Logged out successfully' });
  };

  const removeUser = async (
    req: Request,
    res: Response<ApiResponse<MessageReturn>>
  ) => {
    const user = requireUser(req);

    await prisma.user.deleteMany({ where: { id: user.id } });

    clearAuthCookie(res);

    sendSuccess(res, { message: 'User successfully removed.' });
  };

  return { register, login, logout, removeUser };
};
