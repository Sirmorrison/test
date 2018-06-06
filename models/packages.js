let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let fields = {
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    },
    package_title: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    }
};

let Packages = new Schema(fields, {timestamps: true});
module.exports = mongoose.model('Packages', Packages);