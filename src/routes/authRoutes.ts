import express from "express";

import { register, login, logout } from "../controllers/authController.js";
import { LoginSchema, RegistrationSchema } from "../validators/authValidators.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.post("/register", validateRequest(RegistrationSchema), register);
router.post("/login", validateRequest(LoginSchema), login);
router.post("/logout", logout);

export default router;

// Use openssl rand -base64 32 to generate random secret keys
