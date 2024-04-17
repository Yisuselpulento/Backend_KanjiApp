import mongoose from "mongoose";

const userSchema = mongoose.Schema(
	{
		
		username: {
			type: String,
			required: true,
			unique: true,
            trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
            trim: true,
		},
		password: {
			type: String,
			minLength: 4,
			required: true,
            trim: true,
		},
		profilePic: {
			type: String,
			default: 'default.jpg'
		},
        token: {
            type: String,
          },
		followers: {
			type: [String],
			default: [],
		},
		following: {
			type: [String],
			default: [],
		},
		bio: {
			type: String,
			default: "",
		},
        sexo: { 
            type: String, 
            enum: ['Hombre', 'Mujer', "Otro"] ,
            default: 'Otro'
        },
        age: { 
            type: Number, 
            min: 0, 
            max: 120,
            default: 18
        },
        country: {
            type: String,
            default: 'No Editado'
        },
		isFrozen: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model("User", userSchema);

export default User;