let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let commentField = require('./comment');
let commentSchema = new Schema(commentField ,{timestamps: true});

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField ,{timestamps: true});

let catIdField = require('./cate_tags');
let categorySchema = new Schema(catIdField ,{timestamps: true});

let storyFields = {
    message: {
        type:String,
        required: true
    },
    postedBy: {
        type:String,
        default: 'Ask Oleum',
        required: true
    },
    posterId: {
        type: mongoose.Schema.Types.String,
        ref: 'Admin_user',
        // required:true
    },
    category:[categorySchema],
    likes: [userIdSchema],
    dislikes: [userIdSchema],
    views: Number,
    comments: [commentSchema],
};

let Admin_story = new Schema(storyFields, {timestamps: true});
//Story.index({title: 'text', story: 'text', 'comments.comments': 'text'});
module.exports = mongoose.model('Admin_story', Admin_story);