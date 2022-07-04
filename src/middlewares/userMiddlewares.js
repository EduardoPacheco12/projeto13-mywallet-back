import { transferSchema } from "../schemas/userSchema.js";
import db from "../db.js";

export async function tokenValidation(req, res, next) {
    const { authorization } = req.headers;
    
    const token = authorization?.replace('Bearer ', '')
    const tokenValidation = await db.collection("sessions").findOne({ token: token });
    if(!tokenValidation) {
        return res.status(498).send("Token expirado/inválido");
    }
    res.locals.tokenValidation = tokenValidation;

    next();
}

export async function transferValidation(req, res, next) {
    const body = req.body;

    const transferValidation = transferSchema.validate(body);
    if(transferValidation.error ) {
        return res.status(422).send("Entidade não processável");
    }

    next();
}