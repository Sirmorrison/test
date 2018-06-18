let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let storyIdField = require('./storyId');
let storyIdSchema = new Schema(storyIdField, {timestamps: true});

let answerIdField = require('./answerId');
let answerIdSchema = new Schema(answerIdField, {timestamps: true});

let fields = {
    _id: {
        type: String,
        required: true
    },
    storyId: [storyIdSchema],
    answerId: [answerIdSchema],
};

let Categories = new Schema(fields, {timestamps: true});
module.exports = mongoose.model('Categories', Categories);
