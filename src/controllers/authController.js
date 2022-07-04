import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import db from "../db.js";

export async function SignIn(req, res) {
    const findUser = res.locals.findUser;
    
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
}

export async function SignUp(req, res) {
    const newUser = req.body;
    try {
        const passwordHash = bcrypt.hashSync(newUser.password, 10);
        await db.collection("users").insertOne({ ...newUser, password: passwordHash })
        res.status(201).send("Usuário cadastrado com sucesso");
    } catch (error) {
        res.sendStatus(500);
    }
}