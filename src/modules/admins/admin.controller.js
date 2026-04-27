import { checkExistingUser, createBaseAccount } from "../auth/auth.service.js";
import {
  changeAdminPassword,
  createAdmin,
  fetchAdminById,
  fetchAllAdmins,
  getUserId,
  updateAdmin,
  DeleteAdmin,
  changeAdminBlock,
} from "./admin.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import { sendEmail } from "../../core/utils/sendEmail.js";
import { updateUser } from "../users/user.service.js";

export const addAdmin = async (req, res) => {
  const { firstName, lastName, email, password, phone, role, ...adminData } =
    req.body;
  try {
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      role: role || "admin",
    };

    await checkExistingUser(email, phone);

    const user = await createBaseAccount(userData, role || "admin");

    const admin = await createAdmin(adminData, user._id);

    await sendEmail(
      user.email,
      "Welcome to the Team – New Admin Access Granted",
      `Hi ${user.firstName} ${user.lastName},

                Welcome to the ServiGo App Eng administrative team! We are excited to have you on board.
                
                Your role is essential in ensuring the smooth operation of our platform and maintaining the high standards of our engineering community. You now have access to the administrative dashboard and tools.
                
                Next Steps:
                
                Review Guidelines: Please check the attached "Admin SOP" for our moderation and management protocols.
                
                Team Sync: Join our Slack/Teams channel to stay updated with the rest of the engineering leads.
                
                Explore: Familiarize yourself with the new dashboard features.
                
                We look forward to your contributions to the growth of ServiGo. If you have any questions, feel free to reach out.
                
                Best regards,
                
                The ServiGo Management Team
                `,
    );

    return ApiResponse.success(
      res,
      {
        user,
        admin,
      },
      `${role || "admin"} added successfully.`,
    );
  } catch (e) {
    return ApiResponse.error(res, e.message);
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const result = await fetchAllAdmins(req.query);

    return ApiResponse.success(
      res,
      {
        admins: result.admins,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: Math.ceil(result.total / result.limit),
        },
      },
      "Workers fetched successfully",
    );
  } catch (e) {
    return ApiResponse.error(res, e.message);
  }
};

export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminProfile = await fetchAdminById(id);

    return ApiResponse.success(
      res,
      adminProfile,
      "Worker profile fetched successfully",
    );
  } catch (e) {
    return ApiResponse.error(res, e.message);
  }
};

export const editAdmin = async (req, res) => {
  const { id } = req.params;
  const { role, password, ...adminData } = req.body;

  try {
    const { user, role } = await getUserId(id);

    if (role === "owner") {
      return ApiResponse.error(res, "the owner is can be edited");
    }

    const userProfile = await updateUser(user, adminData);
    const updatedRole = await updateAdmin(role, password, userProfile._id);

    return ApiResponse.success(res, updatedRole, "admin updated successfully");
  } catch (e) {
    return ApiResponse.error(res, e.message);
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user._id;
  try {
    console.log(userId);
    const newPassMessage = await changeAdminPassword(
      userId,
      currentPassword,
      newPassword,
      confirmPassword,
    );
    return ApiResponse.success(res, null, newPassMessage);
  } catch (e) {
    return ApiResponse.error(res, e.message);
  }
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const adminMessage = await DeleteAdmin(id);
    return ApiResponse.success(res, null, adminMessage);
  } catch (e) {
    return ApiResponse.error(res, e.message);
  }
};

export const toggleAdminBlock = async (req, res) => {
  const { id } = req.params;
  try {
    const { isblocked, status } = await changeAdminBlock(id);
    return ApiResponse.success(
      res,
      { isBlocked: isblocked },
      `Admin has been ${status} successfully`,
    );
  } catch (e) {
    return ApiResponse.error(res, e.message);
  }
};
