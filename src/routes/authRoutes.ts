import express from "express";

import { register, login, logout, removeUser } from "../controllers/authController.js";
import { LoginSchema, RegistrationSchema } from "../validators/authValidators.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.post("/register", validateRequest({ body: RegistrationSchema }), register);
router.post("/login", validateRequest({ body: LoginSchema }), login);
router.post("/logout", logout);
router.delete('/remove', removeUser);

export default router;

// Use openssl rand -base64 32 to generate random secret keys
