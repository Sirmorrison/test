let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let fields = {
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'Admin_user',
        required: true
    },
    admin_position: {
        type: String,
        required: true
    },
    role_description: {
        type: String,
        required: true
    }
};

let Admin_positions = new Schema(fields, {timestamps: true});
// Admin_categories.index({title: 1});
module.exports = mongoose.model('Admin_positions', Admin_positions);