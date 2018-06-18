let mongoose = require("mongoose");

module.exports = {
    storyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    }
};