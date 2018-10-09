let mongoose = require("mongoose");
let Schema = mongoose.Schema;


let fields = {
    storyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true,
    }
};

let Story_bookmarks = new Schema(fields, {timestamps: true});
module.exports = mongoose.model('Story_bookmarks', Story_bookmarks);
