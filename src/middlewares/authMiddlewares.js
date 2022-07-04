import bcrypt from "bcrypt";
import { loginSchema } from "../schemas/authSchema.js";
import { registerSchema } from "../schemas/authSchema.js";
import db from "../db.js";

export async function loginValidationMiddleware(req, res, next) {
    const user = req.body

    const loginValidation = loginSchema.validate(user);
    if(loginValidation.error) {
        return res.status(422).send("Entidade de login não processável");
    }

    const findUser = await db.collection("users").findOne({ email: user.email });
    if(!findUser || !(bcrypt.compareSync(user.password, findUser.password))) {
        return res.status(401).send("Login não autorizado");
    }

    res.locals.findUser = findUser;
    next();
}

export async function registerValidationMiddleware(req, res, next) {
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

    next();
}