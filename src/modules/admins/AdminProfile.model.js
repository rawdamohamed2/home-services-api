import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Admin profile must belong to a user"],
        unique: true
    },

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

adminSchema.methods.hasPermission = function(permission, userRole) {
    if (userRole === 'owner') return true;

    return this.permissions.includes(permission);
};
const Admin = mongoose.models.AdminProfile || mongoose.model('AdminProfile', adminSchema);
export default Admin;