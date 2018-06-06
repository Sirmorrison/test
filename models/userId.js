let mongoose = require("mongoose");

module.exports = {
    userId: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    }
};
