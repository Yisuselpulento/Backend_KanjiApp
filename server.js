
import express from 'express';
import dotenv from 'dotenv';
import conectarDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import cors from "cors"; 
import {v2 as cloudinary} from 'cloudinary';
          


dotenv.config();
conectarDB();

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY_CLOUD,
  api_secret: process.env.API_SECRET_CLOUD
});

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());

const corsOptions = {
  origin: process.env.FRONTEND_URL 
};

app.use(cors(corsOptions)); 


app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);


app.listen(PORT, () => {
  console.log(`Servidor Express en funcionamiento en el puerto ${PORT}`);
});

