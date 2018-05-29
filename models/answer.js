let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let commentField = require('./comment');
let commentSchema = new Schema(commentField);

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField);

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
    postedOn: {
        type: Date,
        default: Date.now(),
        required:true
    },
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    }
};

let Answer = new Schema(postFields);
module.exports = mongoose.model('Answer', Answer);