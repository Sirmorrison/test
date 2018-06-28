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
    description: {
        type: String,
        required: true
    }
};

let Admin_categories = new Schema(fields, {timestamps: true});
Admin_categories.index({title: 1});
module.exports = mongoose.model('Admin_categories', Admin_categories);