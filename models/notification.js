let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let notificationFields = {
    message: {
        type:String,
        required: true
    },
    postId: {
        type:String,
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    },
    userId: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    },
    viewed: {
        type :Boolean,
        default: false
    }
};


let Notification = new Schema(notificationFields, {timestamps: true});
    // Notification.createIndex({'updatedAt': 1},)
module.exports = mongoose.model('Notification', Notification);