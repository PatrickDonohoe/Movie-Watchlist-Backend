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

export const createAuthController = ({ prisma }: AppDeps) => {
  const register = async (
    req: Request<{}, ApiResponse<LoginReturn>, RegistrationInput>,
    res: Response<ApiResponse<LoginReturn>>
  ) => {
    // Destructuring the body to access the data sent in the request.
    const { name, email, password } = req.body;

    // Check if user already exists - many methods available through prisma
    const userExists = await prisma.user.findUnique({
      where: { email: email },
    });

    if (userExists)
      throw new AppError('User already exists with this email', 400);

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      omit: { password: true },
    });

    // Generate jwt token
    setAuthCookie(user.id, res);

    sendSuccess(res, { user }, 201);
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
      throw new AppError('Invalid email or password', 401);
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
