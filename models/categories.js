let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let fields = {
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'Admin_user',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
};

let Categories = new Schema(fields, {timestamps: true});
Categories.index({title: 'text'});
module.exports = mongoose.model('Categories', Categories);