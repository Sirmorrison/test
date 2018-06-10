let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField, {timestamps: true});

let fields = {
    bookMarkedBy: [userIdSchema],
    title: {
        type: String,
        required: true
    }
};

let Categories = new Schema(fields, {timestamps: true});
module.exports = mongoose.model('Categories', Categories);
