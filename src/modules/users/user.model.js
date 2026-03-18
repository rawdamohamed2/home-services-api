import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import ApiResponse from "../../core/utils/ApiResponse.js";

const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [3, 'Name is too short'],
        maxlength: [50, 'Name is too long']
    },

    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [3, 'Name is too short'],
        maxlength: [50, 'Name is too long']
    },

    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        match: [
            /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@(gmail\.com|yahoo\.com|yahoo\.co\.uk|yahoo\.fr|ymail\.com|rocketmail\.com)$/,
            'Only Gmail and Yahoo email addresses are allowed'
        ]
    },

    phone: {
        type: String,
        unique: true,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function(v) {
                return /^\+?[\d\s-]{10,}$/.test(v);
            },
            message: 'Please enter a valid phone number'
        }
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        validate: [
            {
                validator: function(v) {
                    return v && v.length >= 6;
                },
                message: 'Password must be at least 6 characters'
            },
            {
                validator: function(v) {
                    return /[A-Z]/.test(v);
                },
                message: 'Password must contain uppercase letter'
            },
            {
                validator: function(v) {
                    return /[@\-$]/.test(v);
                },
                message: 'Password must contain @, -, or $'
            },
            {
                validator: function(v) {
                    return /[0-9]/.test(v);
                },
                message: 'Password must contain number'
            }
        ],
        select: false
    },

    role: {
        type: String,
        enum: {
            values: ["user", "worker", "admin", "moderator", "owner"],
            message: 'Invalid role'
        },
        default: "user"
    },

    profileImage: {
        type: String,
        default: 'https://res.cloudinary.com/dlbgzpo7s/image/upload/v1773087860/user-profile-icon-vector-avatar-600nw-2558760599_czvcso.webp'
    },

    isVerified: {
        type: Boolean,
        default: false
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },

    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet"
    },

    enabledLocation: { type: Boolean, default: false },

    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
            validate: {
                validator: function (value) {
                    if (this.enabledLocation) {
                        return Array.isArray(value) &&
                            value.length === 2 &&
                            value[0] !== 0 &&
                            value[1] !== 0 &&
                            value[0] >= -180 && value[0] <= 180 &&
                            value[1] >= -90 && value[1] <= 90;
                    }
                    return true;
                },
                message: "Invalid location coordinates"
            }
        }
    },

    address: String,

    lastLogin: Date,

    verifyOtp: String,
    verifyOtpExpires: Date,

    resetOtpCode: String,
    resetOtpExpires: Date

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);

    if (!isMatch) {
        throw new Error("Invalid password");
    }

    return true;
};

userSchema.methods.createVerificationCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 أرقام
    this.verifyOtp = code;
    this.verifyOtpExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق
    return code;
};

userSchema.methods.createResetPasswordCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetOtpCode = code;
    this.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق
    return code;
};

userSchema.methods.checkBlock = function() {
    if (this.isBlocked) {
        throw new Error("Your account has been blocked");
    }
};

// Virtual populate for WorkerProfile
userSchema.virtual('workerProfile', {
    ref: 'WorkerProfile',
    localField: '_id',
    foreignField: 'user',
    justOne: true
});

// Virtual populate for AdminProfile
userSchema.virtual('adminProfile', {
    ref: 'AdminProfile',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

// Indexes for better query performance
userSchema.index({ location: "2dsphere" });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;