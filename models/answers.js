let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField, {timestamps: true});

module.exports = {
    answer: {
        type: String,
        required: true
    },
    answeredOn: {
        type: Date,
        default: Date.now()
    },
    answeredBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    },
    likes: [userIdSchema],
    dislikes: [userIdSchema],
};