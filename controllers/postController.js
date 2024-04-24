import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
	try {
		const { text, img } = req.body;
    const postedBy = req.user.id

		if (!postedBy || !text) {
			return res.status(400).json({ error: "El texto esta vacio" });
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

		const newPost = new Post({ author:postedBy, text, img: imageUrl });
		await newPost.save();

	
		res.status(201).json(newPost);
	} catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error al crear el post" });
	}
};

const getPost = async (req, res) => {
  try {
      const post = await Post.findById(req.params.id)
           .select('-__v -updatedAt')
          .populate('author', 'username profilePic')
          .populate('replies.userId', 'username profilePic') 
          .lean();

      if (!post) {
          return res.status(404).json({ error: "Post no encontrado" });
      }

      res.status(200).json(post);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
};

const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post no encontrado" });
		}

		if (post.author.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete post" });
		}

		 if (post.img) {
			const imgIdMatch = post.img.match(/\/([^/]+)\.jpg$/);
          const imgId = imgIdMatch ? imgIdMatch[1] : null;
			await cloudinary.uploader.destroy(`images/${imgId}`);
		} 

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post eliminado exitosamente" });
	} catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error al tratar de borrar el post" });
	}
};

const getUserPosts = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 })
                                .populate('author', 'username profilePic')
                                .select('-__v -updatedAt')
                                .lean();

      
        const formattedPosts = posts.map(post => ({
            ...post,
            author: {
                _id: user._id,
                username: user.username,
                profilePic: user.profilePic
            }
           
        }));

        res.status(200).json(formattedPosts);
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
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId }, $inc: { numberOfLikes: -1 } });
			res.status(200).json({ message: "Post unliked successfully" });
		} else {
			post.likes.push(userId);
			await post.save();
			await Post.updateOne({ _id: postId }, { $inc: { numberOfLikes: 1 } });
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
        const feedPosts = await Post.find({ author: { $in: following } })
                                    .sort({ createdAt: -1 })
                                    .populate('author', 'username profilePic')
                                    .lean();  

        
        const formattedFeedPosts = feedPosts.map(post => ({
            ...post,
            author: {
                _id: post.author._id,
                username: post.author.username,
                profilePic: post.author.profilePic
            }
           
        }));

        res.status(200).json(formattedFeedPosts); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } 
};

const createReply = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;
  try {
    const post = await Post.findById(postId).populate('replies.userId', 'username profilePic');
    if (!post) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

    const newReply = {
      userId,
      text,   
    };

    post.replies.push(newReply);
    post.numberOfReplies = post.replies.length;

    await post.save();

    const savedReply = await Post.findById(postId).populate('replies.userId', 'username profilePic').lean().exec();

    res.status(201).json({ message: 'Respuesta creada correctamente', newReply: savedReply.replies[savedReply.replies.length - 1] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al crear el comentario" });
  }
};
   
const deleteReply = async (req, res) => {
    const { postId, replyId } = req.params;
    try {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      const replyIndex = post.replies.findIndex(reply => reply._id.toString() === replyId.toString());
      if (replyIndex === -1) {
        
        return res.status(404).json({ message: 'Reply not found' });
      }
  
      post.replies.splice(replyIndex, 1);
      post.numberOfReplies = post.replies.length; 
      await post.save();

      res.status(200).json({ message: 'Reply deleted successfully' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error al tratar de borrar comentario" });
    }
  };


export { createPost , getPost , deletePost , getUserPosts , likeUnlikePost , getFeedPosts, createReply , deleteReply };