import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatRoom",
        required: [true, 'Chat room is required'],
        index: true
    },

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Sender is required']
    },

    senderType: {
        type: String,
        enum: {
            values: ["user", "worker", "bot", "admin", "support"],
            message: 'Invalid sender type'
        },
        required: [true, 'Sender type is required']
    },

    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [1000, 'Message too long']
    },

    messageType: {
        type: String,
        enum: {
            values: ["text", "image", "file", "location", "system", "template"],
            message: 'Invalid message type'
        },
        default: "text"
    },

    // للـ quick replies (للبوت)
    quickReplies: [{
        title: String,
        payload: String
    }],

    attachments: [{
        url: String,
        type: String,
        name: String,
        size: Number
    }],

    // للبوت
    intent: String,
    confidence: Number,

    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        reaction: {
            type: String,
            enum: ['👍', '❤️', '😂', '😮', '😢', '😡']
        }
    }],

    isRead: {
        type: Boolean,
        default: false
    },

    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],

    // للرد على رسالة معينة
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1, isRead: 1 });
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // Auto-delete after 30 days

// Post-save middleware (مصحح)
messageSchema.post('save', async function() {
    const ChatRoom = mongoose.model('ChatRoom');
    const chatRoom = await ChatRoom.findById(this.chatRoom);

    if (chatRoom) {
        // تحديث آخر رسالة
        chatRoom.lastMessage = this._id;
        chatRoom.lastMessageAt = this.createdAt;

        // زيادة unread للمشاركين الآخرين
        for (const participant of chatRoom.participants) {
            if (participant.toString() !== this.sender.toString()) {
                chatRoom.incrementUnread(participant);
            }
        }

        await chatRoom.save();
    }
});

// Method لتحديد كمقروءة (مصحح)
messageSchema.methods.markAsRead = async function(userId) {
    if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });

        const ChatRoom = mongoose.model('ChatRoom');
        const chatRoom = await ChatRoom.findById(this.chatRoom);

        const otherParticipants = chatRoom.participants.filter(
            p => p.toString() !== userId.toString()
        );

        // إذا كل المشاركين شافوا الرسالة
        const allRead = otherParticipants.every(p =>
            this.readBy.some(r => r.user.toString() === p.toString())
        );

        if (allRead) {
            this.isRead = true;
        }

        await this.save();
    }

    return this;
};

// Method لإضافة رد فعل
messageSchema.methods.addReaction = function(userId, reaction) {
    const existingReaction = this.reactions.find(
        r => r.user.toString() === userId.toString()
    );

    if (existingReaction) {
        existingReaction.reaction = reaction;
    } else {
        this.reactions.push({ user: userId, reaction });
    }

    return this.save();
};

// Static method لآخر الرسائل
messageSchema.statics.getRecentMessages = async function(chatRoomId, limit = 50) {
    return await this.find({ chatRoom: chatRoomId, isDeleted: false })
        .sort('-createdAt')
        .limit(limit)
        .populate('sender', 'fullName profileImage');
};

module.exports = mongoose.model("Message", messageSchema);
