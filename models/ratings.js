let mongoose = require("mongoose");

module.exports = {
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    ratedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    }
};
