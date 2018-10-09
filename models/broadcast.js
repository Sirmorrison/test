let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let catIdField = require('./cate_tags');
let categorySchema = new Schema(catIdField ,{timestamps: true});

let responseSchema = new Schema({
    message: {
        type: String,
        required: true
    },
    sentBy:{
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    }
});

let fields = {
    sentBy: {
        type: mongoose.Schema.Types.String,
        ref: 'Admin_user',
        required: true
    },
    sentTo: [categorySchema],
    message: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    response: [responseSchema],
};

let Broadcasts = new Schema(fields, {timestamps: true});
module.exports = mongoose.model('Broadcasts', Broadcasts);