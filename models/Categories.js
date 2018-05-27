let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let fields = {
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    postedOn: {
        type:Date,
        default: Date.now(),
        required: true
    }
};

let Categories = new Schema(fields);
module.exports = mongoose.model('bizCategories', Categories);