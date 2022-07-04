import { Router } from 'express';
import { PostDeposit, PostWithdraw, GetStatement } from '../controllers/userController.js';
import { tokenValidation, transferValidation } from '../middlewares/userMiddlewares.js';

const router = Router();

router.post("/deposito", tokenValidation, transferValidation, PostDeposit);

router.post("/saque", tokenValidation, transferValidation, PostWithdraw);

router.get("/extrato", tokenValidation, GetStatement);

export default router;