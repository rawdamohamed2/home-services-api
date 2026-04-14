import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: {
            values: ["admin", "moderator", "owner"],
            message: 'Invalid admin role'
        },
        required: [true, 'Admin role is required']
    },

    permissions: [{
        type: String,
        enum: [
            'manage_users',
            'manage_bookings',
            'manage_services',
            'manage_notifications',
            'manage_ChatAndReviews',
            'manage_settings'
        ]
    }],

    managedWorkers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkerProfile"
    }],

    department: {
        type: String,
        enum: ['operations', 'finance', 'customer_service', 'technical', 'management'],
        default: 'operations'
    },

    lastActive: Date,

    notes: {
        type: String,
        maxlength: 500
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

adminSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission) || this.role === 'owner';
};

const Admin = mongoose.models.AdminProfile || mongoose.model('AdminProfile', adminSchema);
export default Admin;