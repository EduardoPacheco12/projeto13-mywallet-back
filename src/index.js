import express, { json } from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import cors from "cors";
import authRouter from './routes/authRouter.js';
import userRouter from './routes/userRouter.js';
dotenv.config();

const server = express();
server.use(cors());
server.use(json());

server.use(authRouter);
server.use(userRouter);

server.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
})