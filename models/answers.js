let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField, {timestamps: true});

let ratingField = require('./ratings');
let ratingSchema = new Schema(ratingField, {timestamps: true});

module.exports = {
    answer: {
        type: String,
        required: true
    },
    answeredBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    },
    rating: [ratingSchema],
    likes: [userIdSchema],
    dislikes: [userIdSchema],
    views: Number,
};