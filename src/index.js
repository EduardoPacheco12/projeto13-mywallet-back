import express, { json } from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import joi from "joi";
import cors from "cors";
import { MongoClient } from "mongodb";
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URL);
let db;
mongoClient.connect(() => {
  db = mongoClient.db(process.env.MONGO_DATABASE);
});

const server = express();
server.use(cors());
server.use(json());

const registerSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required()
});

server.post("/cadastro", async (req, res) => {
    const user = req.body;

    const registerValidation = registerSchema.validate(user);
    if(registerValidation.error) {
        return res.status(422).send("Entidade de cadastro não processável");
    }

    const findUser = await db.collection("users").findOne({ name: user.name });
    const findEmail = await db.collection("users").findOne({ email: user.email });
    if(findUser || findEmail) {
        return res.status(409).send("Usuário existente");
    }

    try {
        const passwordHash = bcrypt.hashSync(user.password, 10);
        await db.collection("users").insertOne({ ...user, password: passwordHash })
        res.status(201).send("Usuário cadastrado com sucesso");
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }    
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(chalk.blue("Server iniciado!!!"));
})