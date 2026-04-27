import Admin from "./AdminProfile.model.js";
import User from "../users/user.model.js";
import { sendEmail } from "../../core/utils/sendEmail.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

export const getUserIdsByName = async (name) => {
  try {
    if (!name) return [];
    const users = await User.find({
      $or: [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ],
    }).select("_id");
    return users.map((u) => u._id);
  } catch (error) {
    throw new Error(error.message);
  }
};
export const getUserIdsByEmail = async (email) => {
  try {
    if (!email) return [];
    const users = await User.find({
      $or: [{ email: { $regex: email, $options: "i" } }],
    }).select("_id");
    return users.map((u) => u._id);
  } catch (error) {
    throw new Error(error.message);
  }
};
export const getUserId = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId)
      .select("user")
      .populate("user", "role");

    if (!admin) throw new Error("Admin not found");

    const adminData = {
      user: admin.user,
      role: admin.user.role,
    };
    return adminData;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const createAdmin = async (adminData, userId) => {
  try {
    console.log(userId);
    const admin = new Admin({
      user: userId,
      ...adminData,
    });
    await admin.save();

    return admin;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const fetchAllAdmins = async (filters) => {
  try {
    const { page = 1, limit = 10, email, name } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (name) {
      const userIds = await getUserIdsByName(name);
      query.user = { $in: userIds };
    }
    if (email) {
      const emails = await getUserIdsByEmail(email);
      query.user = { $in: emails };
    }

    const [admins, total] = await Promise.all([
      Admin.find(query)
        .select("role")
        .populate("user", "firstName role lastName email isBlocked")
        .limit(parseInt(limit))
        .skip(skip),
      Admin.countDocuments(query),
    ]);

    return {
      admins,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const fetchAdminById = async (id) => {
  try {
    const admin = await Admin.findOne({
      $or: [{ _id: id }, { user: id }],
    })
      .select("permissions department")
      .populate({
        path: "user",
        select: "firstName lastName email role isBlocked",
        populate: {
          path: "roleData",
          select: "permissions",
        },
      });

    if (!admin) {
      throw new Error("No admin profile found.");
    }

    return admin;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateAdmin = async (role, password, userId) => {
  try {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new Error("User not found");
    }
    if (role) user.role = role;
    if (password) user.password = password;

    await user.save();

    await sendEmail(
      user.email,
      "Password Changed Successfully",
      `Hello ${user.firstName},\n\nYour password has been changed successfully.\nIf you didn't make this change, please contact support immediately.`,
    );

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const changeAdminPassword = async (
  userId,
  currentPassword,
  newPassword,
  confirmPassword,
) => {
  try {
    if (newPassword !== confirmPassword) {
      throw new Error("New password and confirmation do not match");
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new Error("Current password is incorrect");
    }

    user.password = newPassword;

    await user.save();

    return "Password changed successfully";
  } catch (error) {
    throw new Error(error.message);
  }
};

export const DeleteAdmin = async (id) => {
  try {
    const adminProfile = await Admin.findOne({
      $or: [{ _id: id }, { user: id }],
    });

    if (!adminProfile) {
      throw new Error("Admin profile not found");
    }

    const userId = adminProfile.user;

    const userAccount = await User.findById(userId);
    if (userAccount.role === "owner") {
      throw new Error("Owner account cannot be deleted via this route");
    }

    await Promise.all([
      Admin.findByIdAndDelete(adminProfile._id),
      User.findByIdAndDelete(userId),
    ]);

    return "Admin and associated user account deleted successfully";
  } catch (error) {
    throw new Error(error.message);
  }
};

export const changeAdminBlock = async (id) => {
  try {
    const adminProfile = await Admin.findOne({
      $or: [{ _id: id }, { user: id }],
    });

    if (!adminProfile) {
      throw new Error("Admin profile not found");
    }

    const userId = adminProfile.user;

    const user = await User.findById(userId);

    if (user.role === "owner") {
      throw new Error("You cannot block the system owner");
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    const status = user.isBlocked ? "blocked" : "unblocked";

    return {
      isblocked: user.isBlocked,
      status,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};
