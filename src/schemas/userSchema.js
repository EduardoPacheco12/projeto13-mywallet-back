import joi from "joi";

export const transferSchema = joi.object({
    value: joi.string().required(),
    description: joi.string().required()
});