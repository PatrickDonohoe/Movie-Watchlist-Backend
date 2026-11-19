import type { Request, Response } from 'express';
import { clearAuthCookie, setAuthCookie } from '../utils/setAuthCookie.js';
import type {
  LoginInput,
  LoginReturn,
  RegistrationInput,
} from '../validators/authValidators.js';
import { ApiResponse } from '../types/api.js';
import { sendSuccess } from '../utils/respond.js';
import { requireUser } from '../utils/requireUser.js';
import type { MessageReturn } from '../types/messageReturn.js';
import type { AuthService } from '../services/authService.js';

export const createAuthController = (authService: AuthService) => {
  const register = async (
    req: Request<{}, ApiResponse<LoginReturn>, RegistrationInput>,
    res: Response<ApiResponse<LoginReturn>>
  ) => {
    const user = await authService.addUser(req.body);
    setAuthCookie(user.id, res);
    return sendSuccess(res, { user }, 201);
  };

  const login = async (
    req: Request<{}, ApiResponse<LoginReturn>, LoginInput>,
    res: Response<ApiResponse<LoginReturn>>
  ) => {
    const user = await authService.loginUser(req.body);

    setAuthCookie(user.id, res);

    return sendSuccess(res, { user });
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

    await authService.deleteUser(user.id);

    clearAuthCookie(res);

    sendSuccess(res, { message: 'User successfully removed.' });
  };

  return { register, login, logout, removeUser };
};
