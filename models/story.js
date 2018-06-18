let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let commentField = require('./comment');
let commentSchema = new Schema(commentField ,{timestamps: true});

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField ,{timestamps: true});

let ratingField = require('./ratings');
let ratingSchema = new Schema(ratingField ,{timestamps: true});

let catIdField = require('./cate_tags');
let categorySchema = new Schema(catIdField ,{timestamps: true});

let storyFields = {
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
    rating: [ratingSchema],
    comments: [commentSchema],
    bookmarks:[userIdSchema],
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    },
};

let Story = new Schema(storyFields, {timestamps: true});
module.exports = mongoose.model('Story', Story);