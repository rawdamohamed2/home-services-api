import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    const token = req.cookies;
    if (!token) {
        return ApiResponse.unauthorized(req, "Not authorized, Login again");
    }
    try {
        const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET);
        if (tokenDecoded.id) {
            req.body.userId = tokenDecoded.id;
        }
        else {
            return ApiResponse.unauthorized(req, "Not authorized, Login again");
        }
        next();
    }
    catch (error) {
        return ApiResponse.unauthorized(req, error.message);
    }
}
export default userAuth ;