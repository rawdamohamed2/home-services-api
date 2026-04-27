import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        unique: [true," role name is already exists"],
        trim: true,
        lowercase: true
    },
    permissions: [{
        type: String,
        enum: [
            'manage_users', 'manage_bookings', 'manage_services',
            'manage_notifications', 'manage_ChatAndReviews', 'manage_settings'
        ],
    }]
}, { timestamps: true });

const Role = mongoose.models.RolePermission || mongoose.model('RolePermission', rolePermissionSchema);
export default Role;