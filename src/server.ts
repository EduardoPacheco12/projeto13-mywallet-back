import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT: number = Number(process.env.PORT);

app.listen(PORT, () => {
  console.log(`Server rodando na porta ${PORT}`);
});
