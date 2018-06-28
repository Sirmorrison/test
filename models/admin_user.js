let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let fields = {
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    admin_position: {
        type: String,
        required: true
    },
    photoUrl: String,
    public_id: String,
    organization: String,
    category: String,
    from: String,
    to: String,
    roles_description: String,
    account_status: {
        type: String,
        default: 'active',
        required: true
    },
};

let Admin_user = new Schema(fields, { timestamps: true });
// User.index({name: 'text', profession: 'text'});
module.exports = mongoose.model('Admin_user', Admin_user);