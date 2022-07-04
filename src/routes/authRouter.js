import { Router } from 'express';
import { SignIn, SignUp } from '../controllers/authController.js';
import {loginValidationMiddleware, registerValidationMiddleware } from '../middlewares/authMiddlewares.js';

const router = Router();

router.post("/cadastro", registerValidationMiddleware ,SignUp);
router.post("/login", loginValidationMiddleware ,SignIn);

export default router;