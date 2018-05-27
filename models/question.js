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
    question: {
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
    answers: [commentSchema],
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

let Question = new Schema(postFields);
module.exports = mongoose.model('Question', Question);