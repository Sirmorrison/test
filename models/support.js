let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let responseSchema = new Schema({
    message: {
        type: String,
        required: true
    },
    sentBy:{
        type: mongoose.Schema.Types.String,
        ref: 'Admin_user',
        required: true
    }
});

let fields = {
    message: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    response: [responseSchema],
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    },
};

let Support = new Schema(fields, { timestamps: true });
module.exports = mongoose.model('Support', Support);