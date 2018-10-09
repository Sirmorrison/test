let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let depositSchema = new Schema({
    deposit:  {
        currency: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    },
},{
    timestamps: true
});

let withdrawSchema = new Schema({
    withdraw:  {
        currency: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    },
    status: {
        type: String,
        required: true,
    },
},{
    timestamps: true
});

let accountField = require('./account_details');
let accountSchema = new Schema(accountField,{timestamps: true});

let mediaField = require('./mediaUpload');
let mediaSchema = new Schema(mediaField);

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField,{timestamps: true});

let catIdField = require('./cate_tags');
let categorySchema = new Schema(catIdField,{timestamps: true});

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
    },
    email: {
        type: String,
        unique: true,
    },
    admin: {
        type: Boolean,
        default: false,
        required: true
    },
    admin_role: {
        type: String
    },
    admin_access: [{
        type: String,
        enums: ['users', 'queries', 'blog', 'stories', 'pricing', 'questions',
            'wallet','messages', 'categories', 'admin', 'account', 'all'],
    }],
    rating: {
        type: Number,
        default: 50
    },
    ranking: {
        type: String,
        default: 'beginner'
    },
    account_status: {
        type: String,
        default: 'active',
        required: true
    },
    subscription: {
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Packages'
        },
        sub_date: String,
        sub_expiry: String,
    },
    referralCode: String,
    referrer: String,
    bio: String,
    company: String,
    role: String,
    profession: String,
    notification: {
        type: Boolean,
        default: false
    },
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
    chat:  {
        currency:  {
            type: String,
            default: 'USD'
        },
        amount: {
            type: Number,
            default: 0
        }
    },
    account_details: [accountSchema],
    profile_picture: [mediaSchema],
    cv_Urls: [mediaSchema],
    withdrawals:  [withdrawSchema],
    deposits: [depositSchema],
    categoryTags:[categorySchema],
    followers:[userIdSchema],
    following:[userIdSchema],
};

let User = new Schema(fields, { timestamps: true });
    User.index({name: 'text', categoryTags:1, ranking:1, packageType:1, profession: 'text'});
module.exports = mongoose.model('User', User);