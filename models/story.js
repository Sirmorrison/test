let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let commentField = require('./comment');
let commentSchema = new Schema(commentField ,{timestamps: true});

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField ,{timestamps: true});

let mediaField = require('./mediaUpload');
let mediaSchema = new Schema(mediaField);

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
    category:[categorySchema],
    likes: [userIdSchema],
    dislikes: [userIdSchema],
    attachment: [mediaSchema],
    views: {
        type: Number,
        default: 0
    },
    rating: [ratingSchema],
    comments: [commentSchema],
    for: String,
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref:'User',
        required:true
    },
};

let Story = new Schema(storyFields, {timestamps: true});
    Story.index({title: 'text', story: 'text', 'comments.comments': 'text'});
module.exports = mongoose.model('Story', Story);