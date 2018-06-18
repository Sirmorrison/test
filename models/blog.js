let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let commentField = require('./comment');
let commentSchema = new Schema(commentField ,{timestamps: true});

let blogFields = {
    message: {
        type:String,
        required: true
    },
    title: {
        type:String,
        required: true
    },
    comments: [commentSchema],
    uploadUrl:String,
    public_id: String,
    mediaType: String,
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    },
};

let Blog = new Schema(blogFields, {timestamps: true});
module.exports = mongoose.model('Blog', Blog);