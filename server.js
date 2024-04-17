
import express from 'express';
import dotenv from 'dotenv';
import conectarDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import cors from "cors"; 

dotenv.config();
conectarDB();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());

const corsOptions = {
  origin: process.env.FRONTEND_URL,
};

app.use(cors(corsOptions)); 


app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);


app.listen(PORT, () => {
  console.log(`Servidor Express en funcionamiento en el puerto ${PORT}`);
});

