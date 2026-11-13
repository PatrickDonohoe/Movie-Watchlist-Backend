import express from 'express';

import { createAuthController } from '../controllers/authController.js';
import {
  LoginSchema,
  RegistrationSchema,
} from '../validators/authValidators.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { AppDeps } from '../app.js';

export const createAuthRouter = (deps: AppDeps) => {
  const c = createAuthController(deps);
  const router = express.Router();

  router.post(
    '/register',
    validateRequest({ body: RegistrationSchema }),
    c.register
  );
  router.post('/login', validateRequest({ body: LoginSchema }), c.login);
  router.post('/logout', c.logout);
  router.delete('/remove', c.removeUser);

  return router;
};

// Use openssl rand -base64 32 to generate random secret keys
