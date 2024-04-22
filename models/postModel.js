import mongoose from "mongoose";

const postSchema = mongoose.Schema(
	{
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		text: {
			type: String,
			maxLength: 500,
            required: true
		},
		img: {
			type: String,
		},
		likes: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
			default: [],
		},
		numberOfLikes : {
			type : Number,
			default : 0
		},
		replies: [
			{
				userId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				text: {
					type: String,
					required: true,
					maxLength: 500,
				}  
			},
		],  
		numberOfReplies : {
			type : Number,
			default : 0
		},
    createdAt: {
        type: Date,
        default: Date.now
    },  
	},
	{
		timestamps: true,
	}
);

const Post = mongoose.model("Post", postSchema);

export default Post;