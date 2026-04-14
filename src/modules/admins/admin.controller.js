import Admin from "./AdminProfile.model.js"
import {createBaseAccount} from "../auth/auth.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";


export const createAdmin = async (req, res) => {
    const {firstName, lastName, email, password, phone, role, ...adminData} = req.body;
    try {
        const userData = {
            firstName,
            lastName,
            email,
            password,
            phone,
            role: role || 'admin'
        };
        const user = await createBaseAccount(userData,role || 'admin' );

        const admin = new Admin(
            {
                userId: user._id,
                ...adminData,
                role: role || 'admin'
            }
        );
        await admin.save();

        return ApiResponse.success(
            res,
            {
                user,
                admin
            },
            "admin created successfully."
        )
    }catch (e) {
        return ApiResponse.error(
            res,
            e.message
        );
    }

}