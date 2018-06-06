let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let commentField = require('./comment');
let commentSchema = new Schema(commentField,{timestamps: true});

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField,{timestamps: true});

let postFields = {
    question: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    answer: {
        type:String,
        required: true
    },
    likes: [userIdSchema],
    dislikes: [userIdSchema],

    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    }
};

let Answer = new Schema(postFields, {timestamps: true});
module.exports = mongoose.model('Answer', Answer);