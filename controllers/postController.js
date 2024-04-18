import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
	try {
		const { postedBy, text, img } = req.body;

      console.log(req.body)

		if (!postedBy || !text) {
			return res.status(400).json({ error: "Usuario y texto son requeridos" });
		}

		const user = await User.findById(postedBy);
		if (!user) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}

		if (user._id.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to create post" });
		}

		const maxLength = 500;
		if (text.length > maxLength) {
			return res.status(400).json({ error: `El texto no puede ser mayor a ${maxLength} caracteres` });
		}

		let imageUrl = null;
		if (img) {
			const uploadedResponse = await cloudinary.uploader.upload(img);
			imageUrl = uploadedResponse.secure_url;
		}

		const newPost = new Post({ postedBy, text, img: imageUrl });
		await newPost.save();
	
		res.status(201).json(newPost);
	} catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error al crear el post" });
	}
};

const getPost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ error: "Post no encontrado" });
		}

		res.status(200).json(post);
	} catch (err) {
        console.log(err)
		res.status(500).json({ error: err.message });
	}
};

const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post no encontrado" });
		}

		if (post.postedBy.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete post" });
		}

		/* if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		} */

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post eliminado exitosamente" });
	} catch (err) {
        console.log(err)
		res.status(500).json({ error: err.message });
	}
};

const getUserPosts = async (req, res) => {
	const { id } = req.params;
    
	try {
        const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}

		const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });

		res.status(200).json(posts);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const likeUnlikePost = async (req, res) => {
	try {
		const { id: postId } = req.params;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post no encontrado" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			res.status(200).json({ message: "Post unliked successfully" });
		} else {
			post.likes.push(userId);
			await post.save();
			res.status(200).json({ message: "Post liked successfully" });
		}
	} catch (err) {
        console.log(err)
		res.status(500).json({ error: err.message });
	}
};

const getFeedPosts = async (req, res) => {
   
     try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const following = user.following;
        const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({ createdAt: -1 });  

        res.status(200).json(feedPosts); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } 
};


export { createPost , getPost , deletePost , getUserPosts , likeUnlikePost , getFeedPosts  };