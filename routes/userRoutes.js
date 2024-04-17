import express from "express";
 import protectRoute from "../middleware/protectRoute.js"; 
import { signupUser, 
         loginUser,
         getUserProfile,
         updateUser,
         followUnFollowUser ,
         perfil
 } from "../controllers/userController.js";


const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/perfil", protectRoute, perfil);
router.get("/profile/:query",protectRoute, getUserProfile);
router.post("/follow/:id", protectRoute, followUnFollowUser);
router.put("/update/:id", protectRoute, updateUser);

 

export default router;