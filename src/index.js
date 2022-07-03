import express, { json } from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import joi from "joi";
import cors from "cors";
import { MongoClient} from "mongodb";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
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

const transferSchema = joi.object({
    value: joi.string().required(),
    description: joi.string().required()
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
});

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
});

server.post("/deposito", async (req, res) => {
    const body = req.body;
    const { authorization } = req.headers;
    
    const token = authorization?.replace('Bearer ', '')
    const tokenValidation = await db.collection("sessions").findOne({ token: token });
    if(!tokenValidation) {
        return res.status(498).send("Token expirado/inválido");
    }

    const transferValidation = transferSchema.validate(body);
    if(transferValidation.error) {
        return res.status(422).send("Entidade não processável");
    }
    
    try {
        const newValue = Number(body.value);
        const newBody = {
            value: newValue.toFixed(2),
            description: body.description,
            type: "depósito",
            day: dayjs().format("DD/MM"),
            idUser: tokenValidation.idUser
        }
        await db.collection("transactions").insertOne(newBody);
        res.status(201).send("Depósito realizado");
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

server.post("/saque", async (req, res) => {
    const body = req.body;
    const { authorization } = req.headers;
    
    const token = authorization?.replace('Bearer ', '')
    const tokenValidation = await db.collection("sessions").findOne({ token: token });
    if(!tokenValidation) {
        return res.status(498).send("Token expirado/inválido");
    }

    const transferValidation = transferSchema.validate(body);
    if(transferValidation.error) {
        return res.status(422).send("Entidade não processável");
    }
    
    try {
        const newValue = Number(body.value);
        const newBody = {
            value: newValue.toFixed(2),
            description: body.description,
            type: "saque",
            day: dayjs().format("DD/MM"),
            idUser: tokenValidation.idUser
        }
        await db.collection("transactions").insertOne(newBody);
        res.status(201).send("Saque realizado");
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

server.get("/extrato", async (req, res) => {
    const { authorization } = req.headers;
    
    const token = authorization?.replace('Bearer ', '')
    const tokenValidation = await db.collection("sessions").findOne({ token: token });
    if(!tokenValidation) {
        return res.status(498).send("Token expirado/inválido");
    }

    const arrayTransactions = await db.collection("transactions").find({ idUser: tokenValidation.idUser }).toArray();
    res.send(arrayTransactions);
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(chalk.blue("Server iniciado!!!"));
})