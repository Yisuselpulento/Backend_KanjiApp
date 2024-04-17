import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import {
	createPost,
    getPost,
    deletePost,
    getUserPosts,
    likeUnlikePost,
    getFeedPosts

} from "../controllers/postController.js";


const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.post("/create", protectRoute, createPost);
router.get("/:id", getPost);
router.delete("/:id", protectRoute, deletePost);
router.get("/user/:id", getUserPosts);
router.put("/like/:id", protectRoute, likeUnlikePost);



export default router;