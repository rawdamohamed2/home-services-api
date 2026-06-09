import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, 'Participant is required']
        }
    ],

    name: {  // ← أضيفي ده
        type: String,
        trim: true
    },

    type: {
        type: String,
        enum: {
            values: ["user_worker", "user_bot", "admin_user", "admin_worker", "support"],
            message: 'Invalid chat room type'
        },
        required: [true, 'Chat room type is required']
    },

    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: function() {
            return this.type === "user_worker";
        }
    },

    // للدعم الفني
    supportTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SupportTicket"
    },

    // حالة المحادثة
    status: {
        type: String,
        enum: ["active", "resolved", "closed"],
        default: "active"
    },

    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },

    lastMessageAt: {
        type: Date,
        default: Date.now
    },

    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    },

    // للمحادثات مع البوت
    botContext: {
        stage: String,
        data: mongoose.Schema.Types.Mixed
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ booking: 1 }, { sparse: true });
chatRoomSchema.index({ lastMessageAt: -1 });
chatRoomSchema.index({ type: 1, createdAt: -1 });
chatRoomSchema.index({ status: 1 });

// Virtual for messages
chatRoomSchema.virtual('messages', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'chatRoom',
    options: { sort: { createdAt: -1 } }
});

// التحقق من وجود المشاركين
chatRoomSchema.path('participants').validate(function(value) {
    if (this.type === 'user_worker') {
        return value.length === 2;
    }
    return value.length >= 2;
}, 'Invalid number of participants for this chat type');

// Middleware قبل الحفظ
chatRoomSchema.pre('save', function(next) {
    // تعيين اسم تلقائي للغرفة
    if (!this.name && this.type === 'user_worker' && this.booking) {
        this.name = `Chat for booking #${this.booking}`;
    }
    next();
});

// Method لإضافة مشارك
chatRoomSchema.methods.addParticipant = function(userId) {
    if (!this.participants.includes(userId)) {
        this.participants.push(userId);
    }
    return this;
};

// Method للتحقق من عضوية المستخدم
chatRoomSchema.methods.isParticipant = function(userId) {
    return this.participants.some(p => p.toString() === userId.toString());
};

// Method لزيادة عدد الرسائل غير المقروءة (أضيفي ده)
chatRoomSchema.methods.incrementUnread = function(userId) {
    const key = userId.toString();
    const current = this.unreadCount.get(key) || 0;
    this.unreadCount.set(key, current + 1);
};

// Method لتصفير عدد الرسائل غير المقروءة
chatRoomSchema.methods.resetUnread = function(userId) {
    this.unreadCount.set(userId.toString(), 0);
};

// Static method لإنشاء غرفة محادثة للحجز
chatRoomSchema.statics.createForBooking = async function(bookingId, userId, workerId) {
    const chatRoom = await this.create({
        participants: [userId, workerId],
        type: 'user_worker',
        booking: bookingId,
        status: 'active'
    });

    return chatRoom;
};


chatRoomSchema.statics.createBotRoom = async function(userId) {
    const botId = '000000000000000000000001';

    return await this.create({
        participants: [userId, botId],
        type: 'user_bot',
        status: 'active',
        botContext: {
            stage: 'greeting',
            data: {}
        }
    });
};


chatRoomSchema.statics.createSupportRoom = async function(userId) {

    const admin = await mongoose.model('User').findOne({
        role: { $in: ['admin', 'support'] }
    });

    return await this.create({
        participants: [userId, admin._id],
        type: 'support',
        status: 'active'
    });
};

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
