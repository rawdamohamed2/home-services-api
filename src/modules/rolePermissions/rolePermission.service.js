import Role from "./rolePermission.model.js";

export const fetchRolePermissions = async function (){
    try {
        const rolePermissions = Role.find();

        return rolePermissions;
    }catch (error) {
        throw new Error(error);
    }
};

export const createRole = async (role) => {
    try {
        const rolePermission = new Role(role);
        await rolePermission.save();

        return rolePermission;
    }catch (error) {
        throw new Error(error);
    }
};

export const insertPermission = async (roleId, permissions) => {
    try {
        const rolePermission = await Role.findOneAndUpdate(
            {_id:roleId},
            { permissions: permissions },
            { new: true, upsert: true }
        );

        return rolePermission;
    }catch (error) {
        throw new Error(error);
    }
};

export const createRolePermission = async function (roleData) {
    try {
        const rolePermission = new Role(roleData);
        await rolePermission.save();

        return rolePermission;
    }catch (error) {
        throw new Error(error);
    }
};

export const updateRolePermission = async function (roleId, roleData) {
    try {

        const updatedRole = await Role.findOneAndUpdate(
            { _id: roleId },
            roleData,
            { new: true, upsert: true }
        );

        return updatedRole;
    } catch (error) {
        throw new Error(`Failed to update role: ${error.message}`);
    }
};