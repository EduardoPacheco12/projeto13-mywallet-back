import dayjs from "dayjs";
import { transferSchema } from "../schemas/userSchema.js";
import db from "../db.js";

export async function GetStatement(req, res) {
    const tokenValidation = res.locals.tokenValidation;

    let arrayTransactions = await db.collection("transactions").find({ idUser: tokenValidation.idUser }).toArray();
    if(arrayTransactions.length > 12) {
        arrayTransactions = arrayTransactions.slice(-12);
    }
    let totalValue = 0;
    arrayTransactions.map((response) => {
        if(response.type === "depósito") {
            totalValue += Number(response.value);
        }
        if(response.type === "saque") {
            totalValue -= Number(response.value);
        }
    })
    res.send({
        array: arrayTransactions,
        totalValue: totalValue.toFixed(2)
    });
}

export async function PostWithdraw(req, res) {
    const tokenValidation = res.locals.tokenValidation;
    const body = req.body;
    
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
}

export async function PostDeposit(req, res) {
    const tokenValidation = res.locals.tokenValidation;
    const body = req.body;
    
    try {
        let newValue = Number(body.value);
        if(newValue < 0) {
            newValue = Math.abs(newValue);
        }
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
}