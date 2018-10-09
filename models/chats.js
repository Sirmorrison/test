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
},{
    timestamps: true
});

let fields = {
    sentBy: {
        type: mongoose.Schema.Types.String,
        ref: 'Admin_user',
        required: true
    },
    sentTo: {
        type: mongoose.Schema.Types.String,
        ref: 'Admin_user',
        required: true
    },
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

let Chats = new Schema(fields, {timestamps: true});
module.exports = mongoose.model('Chats', Chats);