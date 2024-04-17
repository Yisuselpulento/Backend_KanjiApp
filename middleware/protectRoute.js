import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password -createdAt -updatedAt -__v -token");

      req.user = user;

      return next();
    } catch (error) {
      return res.status(401).json({ msg: "Hubo un error" });
    }
  }

  next(); 
};


export default protectRoute;