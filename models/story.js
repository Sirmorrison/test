"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let commentField = require('./comment');
let commentSchema = new Schema(commentField);

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField);

let catIdField = require('./cate_tags');
let categorySchema = new Schema(catIdField);

let postFields = {
    story: {
        type:String,
        required: true
    },
    title: {
        type:String,
        required: true
    },
    category:[categorySchema],
    likes: [userIdSchema],
    dislikes: [userIdSchema],
    views: [userIdSchema],
    comments: [commentSchema],
    postedOn: {
        type: Date,
        default: Date.now(),
        required:true
    },
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    },
};

let Story = new Schema(postFields);
module.exports = mongoose.model('Story', Story);