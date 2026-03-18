import jwt from "jsonwebtoken";
import User from "../../modules/users/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return ApiResponse.unauthorized(res, "Not authorized, no token");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) {
            return res.status(401).json({
                message: 'User not found'
            });
        }
        next();
    } catch (err) {
        return ApiResponse.unauthorized(res, "Not authorized, token failed" );
    }
};

