let mongoose = require("mongoose");

module.exports = {
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        required: true
    }
};