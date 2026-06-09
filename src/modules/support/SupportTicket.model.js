import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required']
    },

    subject: {
        type: String,
        required: [true, 'Subject is required'],
        enum: {
            values: ["booking_issue", "service_inquiry", "payment_issue", "complaint", "suggestion", "technical_issue"],
            message: 'Invalid subject'
        }
    },

    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },

    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium"
    },

    status: {
        type: String,
        enum: ["open", "in_progress", "resolved", "closed"],
        default: "open"
    },

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatRoom"
    },



    // Attachments (if user wants to upload images)
    attachments: [{
        url: String,
        name: String,
        type: String
    }],


    userRating: {
        type: Number,
        min: 1,
        max: 5
    },


    resolvedAt: Date,
    closedAt: Date,


    closureReason: String,


    adminNotes: String

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ priority: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });



// Calculate resolution time
supportTicketSchema.virtual('resolutionTime').get(function() {
    if (this.resolvedAt) {
        const diff = this.resolvedAt - this.createdAt;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
    return null;
});


supportTicketSchema.virtual('isOverdue').get(function() {
    if (this.status === 'resolved' || this.status === 'closed') return false;

    const hoursSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60);

    const timeLimits = {
        urgent: 24,
        high: 48,
        medium: 72,
        low: 120
    };

    return hoursSinceCreation > (timeLimits[this.priority] || 72);
});


supportTicketSchema.pre('save', function(next) {
    // Set timestamps based on status
    if (this.isModified('status')) {
        if (this.status === 'resolved' && !this.resolvedAt) {
            this.resolvedAt = new Date();
        }
        if (this.status === 'closed' && !this.closedAt) {
            this.closedAt = new Date();
        }
    }
    next();
});



// Assign ticket to admin
supportTicketSchema.methods.assignTo = async function(adminId) {
    this.assignedTo = adminId;
    this.status = 'in_progress';
    await this.save();

    // Create notification for admin
    const Notification = mongoose.model('Notification');
    await Notification.create({
        user: adminId,
        title: 'New Ticket Assigned',
        body: `Ticket #${this._id.toString().slice(-6)} has been assigned to you`,
        type: 'ticket_assigned',
        data: { ticketId: this._id }
    });

    return this;
};

// Resolve ticket
supportTicketSchema.methods.resolve = async function() {
    this.status = 'resolved';
    this.resolvedAt = new Date();
    await this.save();

    // Notify user
    const Notification = mongoose.model('Notification');
    await Notification.create({
        user: this.user,
        title: 'Ticket Resolved',
        body: 'Your support ticket has been resolved',
        type: 'ticket_resolved',
        data: { ticketId: this._id }
    });

    return this;
};

// Close ticket
supportTicketSchema.methods.close = async function(reason, adminId) {
    this.status = 'closed';
    this.closedAt = new Date();
    this.closureReason = reason;
    await this.save();

    return this;
};

// Add admin note
supportTicketSchema.methods.addNote = function(note) {
    this.adminNotes = note;
    return this.save();
};


// Get open tickets
supportTicketSchema.statics.getOpenTickets = async function() {
    return await this.find({
        status: { $in: ['open', 'in_progress'] }
    })
        .populate('user', 'fullName email phone')
        .populate('assignedTo', 'fullName')
        .sort('-priority -createdAt');
};

// Get tickets assigned to specific admin
supportTicketSchema.statics.getAdminTickets = async function(adminId) {
    return await this.find({
        assignedTo: adminId,
        status: { $ne: 'closed' }
    })
        .populate('user', 'fullName')
        .sort('-createdAt');
};

// Get statistics
supportTicketSchema.statics.getStats = async function() {
    const [byStatus, byPriority, overdue] = await Promise.all([
        this.aggregate([
            { $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }}
        ]),
        this.aggregate([
            { $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }}
        ]),
        this.find({
            status: { $in: ['open', 'in_progress'] }
        }).then(tickets =>
            tickets.filter(t => t.isOverdue).length
        )
    ]);

    const total = await this.countDocuments();
    const avgResolutionTime = await this.aggregate([
        { $match: { resolvedAt: { $ne: null } } },
        { $project: {
                resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] }
            }},
        { $group: {
                _id: null,
                avgTime: { $avg: '$resolutionTime' }
            }}
    ]);

    return {
        total,
        byStatus,
        byPriority,
        overdue,
        avgResolutionTime: avgResolutionTime[0]?.avgTime
            ? Math.floor(avgResolutionTime[0].avgTime / (1000 * 60 * 60)) + ' hours'
            : 'N/A'
    };
};

module.exports = mongoose.model("SupportTicket", supportTicketSchema);