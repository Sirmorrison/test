"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let commentField = require('./comment');
let commentSchema = new Schema(commentField,{timestamps: true});

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField,{timestamps: true});

let postFields = {
    idea: String,
    message: String,
    mediaUrl: String,
    mediaType: String,
    public_id: String,
    likes: [userIdSchema],
    tagged: [userIdSchema],
    comment: [commentSchema],
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User'
    },
    businessId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business'
    }
};

let Post = new Schema(postFields, { timestamps: true });
module.exports = mongoose.model('Question', Post);