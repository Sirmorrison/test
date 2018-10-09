let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// let answerField = require('./answers');
// let answerSchema = new Schema(answerField,{timestamps: true});

let commentField = require('./comment');
let commentSchema = new Schema(commentField ,{timestamps: true});

let catIdField = require('./cate_tags');
let categorySchema = new Schema(catIdField,{timestamps: true});

let questionFields = {
    question: {
        type:String,
        required: true
    },
    category:[categorySchema],
    views: {
        type: Number,
        default: 0
    },
    comments: [commentSchema],
    // answers: [answerSchema],
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    },
};

let Question = new Schema(questionFields, {timestamps: true});
Question.index({question: 'text', 'category.categoryId':1});
module.exports = mongoose.model('Question', Question);