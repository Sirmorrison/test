let mongoose = require("mongoose");

module.exports = {
    categoryId: {
        type: mongoose.Schema.Types.String,
        ref: 'Categories',
        required: true
    }
};