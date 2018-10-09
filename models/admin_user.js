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
    role: {
        type: String,
        unique: true
    },
    admin_function: [{
        type: String,
        enums: ['users', 'queries', 'blog', 'stories', 'pricing', 'questions',
                'wallet','messages', 'categories', 'admin', 'account', 'all'],
        required: true
    }],
    passcode: String,
    walletBalance:  {
        currency:  {
            type: String,
            default: 'USD'
        },
        amount: {
            type: Number,
            default: 0
        }
    },
    photoUrl: String,
    public_id: String,
    account_status: {
        type: String,
        default: 'active',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.String,
        ref: 'Admin_user',
        required:true
    },
    security: String,
    experience:{
        organization: {
            type: String,
            // required: true
        },
        category:{
            type: String,
            // required: true
        },
        from: {
            type: String,
            // required: true
        },
        to: {
            type: String,
            // required: true
        },
        role_description: {
            type: String,
            // required: true
        }
    }
};

let Admin_user = new Schema(fields, { timestamps: true });
Admin_user.index({name: 'text', role: 1});
module.exports = mongoose.model('Admin_user', Admin_user);