let mongoose = require("mongoose");
let Schema = mongoose.Schema;


let fields = {
    questionId: {
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

let Question_bookmarks = new Schema(fields, {timestamps: true});
module.exports = mongoose.model('Question_bookmarks', Question_bookmarks);