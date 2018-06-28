let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let answerField = require('./answers');
let answerSchema = new Schema(answerField,{timestamps: true});

// let userIdField = require('./userId');
// let userIdSchema = new Schema(userIdField,{timestamps: true});

let catIdField = require('./cate_tags');
let categorySchema = new Schema(catIdField,{timestamps: true});

let questionFields = {
    question: {
        type:String,
        required: true
    },
    category:[categorySchema],
    views: Number,
    answers: [answerSchema],
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    },
};

let Question = new Schema(questionFields, {timestamps: true});
Question.index({question: 'text', 'answers.answer': 'text'});
module.exports = mongoose.model('Question', Question);