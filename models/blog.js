let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let commentField = require('./comment');
let commentSchema = new Schema(commentField ,{timestamps: true});

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField, {timestamps: true});

let mediaField = require('./mediaUpload');
let mediaSchema = new Schema(mediaField);

let blogFields = {
    message: {
        type:String,
        required: true
    },
    title: {
        type:String,
        required: true
    },
    status: {
        type: String,
        enums: (["suspended","approved"]),
        required: true,
        default: 'active'
    },
    comments: [commentSchema],
    likes: [userIdSchema],
    attachment: [mediaSchema],
    views: {
        type: Number,
        default: 0
    },
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    },
};

let Blog = new Schema(blogFields, {timestamps: true});
Blog.index({status: 1, message: 'text', title: 'text', postedBy:1});
module.exports = mongoose.model('Blog', Blog);