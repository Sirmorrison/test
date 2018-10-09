let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let fields = {
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
};


let Feedback = new Schema(fields, { timestamps: true });
module.exports = mongoose.model('Feedback', Feedback);