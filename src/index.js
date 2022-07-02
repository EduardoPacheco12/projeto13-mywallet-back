import express, { json } from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import joi from "joi";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
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

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
});

server.post("/cadastro", async (req, res) => {
    const newUser = req.body;

    const registerValidation = registerSchema.validate(newUser);
    if(registerValidation.error) {
        return res.status(422).send("Entidade de cadastro não processável");
    }

    const findUser = await db.collection("users").findOne({ name: newUser.name });
    const findEmail = await db.collection("users").findOne({ email: newUser.email });
    if(findUser || findEmail) {
        return res.status(409).send("Usuário existente");
    }

    try {
        const passwordHash = bcrypt.hashSync(newUser.password, 10);
        await db.collection("users").insertOne({ ...newUser, password: passwordHash })
        res.status(201).send("Usuário cadastrado com sucesso");
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }    
})

server.post("/login", async (req, res) => {
    const user = req.body

    const loginValidation = loginSchema.validate(user);
    if(loginValidation.error) {
        return res.status(422).send("Entidade de login não processável");
    }

    const findUser = await db.collection("users").findOne({ email: user.email });
    if(!findUser || !(bcrypt.compareSync(user.password, findUser.password))) {
        return res.status(401).send("Login não autorizado");
    }
    const findToken = await db.collection("sessions").findOne({ idUser: findUser._id });
    if(!findToken) {
        const token = uuid();
        await db.collection("sessions").insertOne({
            token,
            idUser: findUser._id
        })
        res.send({
            name: findUser.name,
            token: token
        });
    } else {
        const token = uuid();
        await db.collection("sessions").updateOne(
            { 
                idUser: findUser._id 
            }, 
            { 
                $set: { token: token }
            })
        res.send({
            name: findUser.name,
            token: token
        });
    }
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(chalk.blue("Server iniciado!!!"));
})