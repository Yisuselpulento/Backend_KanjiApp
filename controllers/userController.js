import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import generarJWT from  "../helpers/generarJWT.js"
import mongoose from "mongoose";
import Post from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";

const signupUser = async (req, res) => {

    const {  email, username, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      const error = new Error("Usuario o Email ya registrado");
    return res.status(400).json({ msg: error.message });
    }

    if (password.length < 4) {
        const error = new Error("El password debe ser mayor a 4 caracteres");
      return res.status(400).json({ msg: error.message });
      }

	try {	      
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			email,
			username,
			password: hashedPassword,
		});
		await newUser.save();

		 if (newUser) {
            res.json({
                msg: "Usuario Creado Correctamente, Inicia sesion",
              });
		} else {
			res.status(400).json({ error: "Data de usuario invalida" });
		}    
	} catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error interno del servidor' });
        
	}
};

const loginUser = async (req, res) => {

    const { username, password } = req.body;

	try {
		
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
            const error = new Error("Usuario o password invalida");
            return res.status(404).json({ msg: error.message });
        } 


		res.status(200).json({
			_id: user._id,
			username: user.username,
			email: user.email,
			bio: user.bio,
			profilePic: user.profilePic,
            sexo: user.sexo,
            image: user.image,
            country: user.country,
            age: user.age,
            token: generarJWT(user._id),
		});
	} catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error interno del servidor' });
	}
};

const perfil = async (req, res) => {
    const { user } = req;
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
  
    res.json(user);
  };

const getUserProfile = async (req, res) => {

    try {
        const user = await User.findById(req.params.query).select('-password -email -__v -createdAt -updatedAt -isFrozen')
      
        if (!user) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.status(200).json(user);
      } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
};


const followUnFollowUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "id de usuario invalido" });
        }

        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "No puedes seguirte a ti mismo" });
        }

        const [userToModify, currentUser] = await Promise.all([
            User.findById(id),
            User.findById(req.user._id)
        ]);

        if (!userToModify || !currentUser) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            await Promise.all([
                User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } }),
                User.findByIdAndUpdate(req.user._id, { $pull: { following: id } })
            ]);
            return res.status(200).json({ message: "Usuario eliminado exitosamente" });
        } else {
            await Promise.all([
                User.findByIdAndUpdate(id, { $push: { followers: req.user._id } }),
                User.findByIdAndUpdate(req.user._id, { $push: { following: id } })
            ]);
            return res.status(200).json({ message: "Usuario seguido exitosamente" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log("Error in followUnFollowUser: ", err.message);
    }
};



const updateUser = async (req, res) => {
    
	 const { age, country, sexo , bio } = req.body;
	let { profilePic } = req.body;

    

	const userId = req.user._id;
	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "No puedes Actualizar otro usuario" });


		if (profilePic) {
			if (user.profilePic) {
				await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profilePic);
			profilePic = uploadedResponse.secure_url;
		}

		user.age = age || user.age;
		user.country = country || user.country;
		user.sexo = sexo || user.sexo;
		user.profilePic = profilePic || user.profilePic;
		user.bio = bio || user.bio;

		user = await user.save();

		await Post.updateMany(
			{ "replies.userId": userId },
			{
				$set: {
					"replies.$[reply].userProfilePic": user.profilePic,
				},
			},
			{ arrayFilters: [{ "reply.userId": userId }] }
		);


		res.status(200).json(user);
	} catch (err) {
	  console.log(err);
      res.status(500).json({ message: "Error al actualizar" });
	}  
};

const searchUserbyUsername = async (req, res) => {
    try {
      const nickUser = req.params.username;     
  
      if (!nickUser) {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }
  
      const usuarios = await User.find({ username: { $regex: nickUser, $options: 'i' } }); 
  
  
      if (!usuarios.length) {
        return res.status(404).json({ error: 'No se encontraron usuarios' });
      }
     
      return res.status(200).json(usuarios);
    } catch (error) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }


export { signupUser, loginUser , getUserProfile ,updateUser,followUnFollowUser, perfil,searchUserbyUsername }