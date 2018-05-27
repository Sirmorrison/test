let mongoose = require("mongoose");

module.exports = {
    comment: {
        type: String,
        required: true
    },
    commentOn: {
        type: Date,
        default: Date.now()
    },
    commentedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    },
};