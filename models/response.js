let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let fields = {
    sentTo: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    }
};

let Response = new Schema(fields, {timestamps: true});
module.exports = mongoose.model('Response', Response);