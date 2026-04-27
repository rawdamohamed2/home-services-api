import ApiResponse from "../../core/utils/ApiResponse.js";
import {
    createRole,
    createRolePermission,
    fetchRolePermissions, insertPermission,
    updateRolePermission
} from "./rolePermission.service.js";

export const getRolePermissions =  async (req, res) => {
    const roleData = req.body;
    try {
        const roles = await fetchRolePermissions(roleData);

        return ApiResponse.success(
            res,
            roles,
            "Role fetched successfully.",
        );
    } catch (e) {
        return ApiResponse.error(
            res,
            e.message
        )
    }
};

export const addRole = async (req, res) => {
    const role = req.body;
    try {
        const Role = await createRole(role);
        return ApiResponse.success(
            res,
            Role,
            "Role created successfully.",
        );
    } catch (e) {
        return ApiResponse.error(
            res,
            e.message
        )
    }
};

export const addPermission = async (req, res) => {
    const {permissions} = req.body;
    const {roleId} = req.params
    try {
        const Permission = await insertPermission(roleId, permissions);

        return ApiResponse.success(
            res,
            Permission,
            "Permission added successfully.",
        );
    } catch (e) {
        return ApiResponse.error(
            res,
            e.message
        )
    }
};

// full rolePermission
export const addRolePermission =  async (req, res) => {
    const roleData = req.body;
    try {
        const role = await createRolePermission(roleData);
        return ApiResponse.success(
            res,
            role,
            "Role created successfully.",
        );
    } catch (e) {
        return ApiResponse.error(
            res,
            e.message
        )
    }
};

export const editRolePermission =  async (req, res) => {
    const roleData = req.body;
    const {roleId} = req.params
    try {
        const role = await updateRolePermission(roleId, roleData);
        return ApiResponse.success(
            res,
            role,
            "Role updated successfully.",
        );
    } catch (e) {
        return ApiResponse.error(
            res,
            e.message
        )
    }
};