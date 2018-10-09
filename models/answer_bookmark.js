let mongoose = require("mongoose");
let Schema = mongoose.Schema;


let fields = {
    answerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Questions',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true,
    }
};

let Answer_bookmarks = new Schema(fields, {timestamps: true});
module.exports = mongoose.model('Answer_bookmarks', Answer_bookmarks);