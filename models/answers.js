let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let mediaField = require('./mediaUpload');
let mediaSchema = new Schema(mediaField);

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField, {timestamps: true});

let fields = {
    answer: {
        type: String,
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    view_cost: {
        currency: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    },
    answeredBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    },
    attachment: [mediaSchema],
    likes: [userIdSchema],
    dislikes: [userIdSchema],
    views: {
        type: Number,
        default: 0
    },
};

let Answers = new Schema(fields, { timestamps: true });
Answers.index({answer: 'text', answeredBy: 1, postId:1});
module.exports = mongoose.model('Answers', Answers);