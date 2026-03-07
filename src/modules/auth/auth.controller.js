import User from '../users/User.model.js';
import Worker from '../workers/WorkerProfile.model.js';
import Wallet from '../payments/Wallet.model.js';
import ApiResponse from "../../core/utils/ApiResponse.js";
import {generateToken} from "../../core/utils/generateToken.js";
import {sendEmail} from "../../core/utils/sendEmail.js";

export const register = async (req,res) => {
    const {fullName, email, password, phone, enabledLocation, location, profileImage, role, ...otherData} = req.body;

    if(!fullName || !email || !password || !phone || !role) {
        return ApiResponse.error(res,"fullName, email, password, phone and role are required");
    }
    if (role === "worker"){
        if (
            !otherData.categories?.length ||
            !otherData.nationalIdFront ||
            !otherData.nationalIdBack ||
            !otherData.address.city
        ){
            return ApiResponse.error(
                res,
                "Worker fields are missing",
            );
        }
        const isFurnitureMoving = otherData.categories?.some(cat =>
            cat.includes('699a7d33e5d5066bdd58c9a8')
            // cat.toString().includes('Moving') ||
            // cat.toString().includes('نقل') ||
            // cat.toString().includes('عفش')
        );
        if (isFurnitureMoving) {
            if (!otherData.vehicleType){
                return ApiResponse.error(
                    res,
                    "vehicleType is required",
                );
            }
            if (!otherData.licenseImage){
                return ApiResponse.error(
                    res,
                    "License Image is required",
                );
            }
        }
    }

    if (role === "admin" || role === "moderator" || role === "owner"){
        return ApiResponse.error(
            res,
            "admin can't register"
        );
    }

    try {
        const existingUser = await User.findOne({
            $or:[{email: email}, {phone: phone}]
        });

        if (existingUser) {
            return ApiResponse.conflict(res, 'User already exists with this email or phone');
        }

        const user = new User(
            {
                fullName,
                email,
                password,
                phone,
                enabledLocation,
                location,
                profileImage,
                role
            }
        );
        await user.save();

        await Wallet.create({ owner: user._id });

        if (role === "worker"){
            const workerData = {
                user: user._id,
                categories: otherData.categories,
                nationalIdFront: otherData.nationalIdFront,
                nationalIdBack: otherData.nationalIdBack,
                bio: otherData.bio || "",
                experienceYears: otherData.experienceYears || 0,
                vehicleType: otherData.vehicleType || "",
                licenseImage: otherData.licenseImage || "",
                availability: otherData.availability || []
            };
            await Worker.create(workerData);
            console.log('worker successfully created');
        }

        const token = generateToken(user._id);

        const data = {
            user: user,
            token: token,
        }

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        await sendEmail(
            email,
            "Welcome to ServiGo",
            `Welcome to our serviGo app. Your account has been created successfully.`
        );

        return ApiResponse.success(
            res,
            data,
            "user created successfully",
        );

    }
    catch(error) {
        return ApiResponse.error(res, error.message);
    }
}

export const login = async (req,res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return ApiResponse.error(res,"email and password is required");
    }
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
           return ApiResponse.error(res,"No account found with this email");
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return ApiResponse.error(res,"invalid password");
        }
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked"
            });
        }

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);

        const data = {
            user: user,
            token: token,
        }

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        await sendEmail(
            email,
            "New Login Notification",
            `Hello ${user.fullName},\n\nSomeone just logged into your account.\nIf this wasn't you, please secure your account immediately.`
        );
        return ApiResponse.success(
            res,
            data,
            "user Login successfully",
        );
    }
    catch (error) {
        return ApiResponse.error(res,error.message);
    }
}

export const logout = async (req, res) => {
    res.cookie('token', "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ?
            'none' : 'strict',
        expires: new Date(0),
    });
    return ApiResponse.success(res, null, "user Logout successfully");
}

export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return ApiResponse.error(res,"No account found with this id");
        }
        if (user.isVerified){
            return ApiResponse.success(res,null ,"Account Already verified");
        }
        const otp = user.createVerificationCode();

        if (!otp) {
            return ApiResponse.error(res,"Failed to Generate Verification Otp");
        }

        await user.save();

        await sendEmail(
            user.email,
            "Account Verification OTP",
            `Your Otp is ${otp}. verify your Account using this Otp.`
        );

        return ApiResponse.success(res,null, "Verify Otp Send successfully to your email");
    }
    catch(error) {
        return ApiResponse.error(res, error.message);
    }
}

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        return ApiResponse.error(res,"User ID and OTP are required");
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return ApiResponse.error(res,"No account found with this id");
        }

        if(user.verifyOtp !== otp || user.verifyOtp === ""){
            return ApiResponse.error(res,"Invalid OTP code");
        }
        if (user.verifyOtpExpires < Date.now()) {
            return ApiResponse.error(res,"OTP code has expired");
        }

        user.isVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpires = 0;
        await user.save();
        return ApiResponse.success(
            res,
            {
                data: {
                    verified: true,
                    userId: user._id
                }
            },
            "Your Account has been verified");

    }
    catch (error){
        return ApiResponse.error(res,error.message);
    }
}

//send password reset otp
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return ApiResponse.error(res,"Email is required");
    }

    try {
        const user = await User.findOne({email});
        if (!user) {
            return ApiResponse.error(res,"No account found with this email");
        }

        const otp = user.createResetPasswordCode();
        if (!otp) {
            return ApiResponse.error(res,"Failed to Generate Reset Otp");
        }
        await user.save();

        await sendEmail(
            user.email,
            "Password Reset OTP",
            `Your Otp for resetting your password is ${otp}. 
            Use this OTP to proceed with resetting your password.`
        );

        return ApiResponse.success(
            res,
            {
                data:{
                    id:user._id
                }
            },
            "OTP Send successfully to your email"
        );
    }
    catch (error) {
        return ApiResponse.error(res,error.message);
    }
}

export const isAuthenticated = async (req, res) => {
    try {
        return ApiResponse.success(res,null, "User Authenticated Successfully");
    }
    catch(error) {
        return ApiResponse.error(res,error.message);
    }
}

export const verifyResetOtp  = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        return ApiResponse.error(res,"User ID and OTP are required");
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return ApiResponse.error(res,"No account found with this ID");
        }

        if(user.resetOtpCode !== otp || user.resetOtpCode === ""){
            return ApiResponse.error(res,"Invalid OTP code");
        }
        if (user.resetOtpExpires < Date.now()) {
            return ApiResponse.error(res,"OTP code has expired");
        }

        user.isOtpVerified = true;
        await user.save();

        return ApiResponse.success(res,
            {
                data: {
                    verified: true,
                    userId: user._id
                }
            },
            "OTP verified successfully"
        );

    }
    catch (error){
        return ApiResponse.error(res,error.message);
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { userId, newPassword, confirmPassword } = req.body;
        if (!userId || !newPassword || !confirmPassword) {
            return ApiResponse.error(
                res,
                "User ID, new password and confirm password are required"
            );
        }
        if (newPassword !== confirmPassword) {
            return ApiResponse.error(
                res,
                "Passwords do not match"
            );
        }
        if(newPassword.length < 6) {
            return ApiResponse.error(
                res,
                "Password must be at least 6 characters"
            );
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return ApiResponse.error(res,"No account found with this ID");
        }

        user.password = newPassword;
        user.resetOtpCode = '';
        user.resetOtpExpires = 0;
        user.isOtpVerified = false;
        await user.save();

        await sendEmail(
            user.email,
            "Password Changed Successfully",
            `Hello ${user.fullName},\n\nYour password has been changed successfully.
            \nIf you didn't do this, please contact support immediately.`
        );

        return ApiResponse.success(
            res,
            null,
            "Password reset successfully"
            )
    }
    catch(error) {
        return ApiResponse.error(res,error.message);
    }
}