import express from "express";

import { register, login, logout } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;

// Use openssl rand -base64 32 to generate random secret keys
