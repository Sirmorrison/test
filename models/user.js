let mongoose = require("mongoose");
let Schema = mongoose.Schema;

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
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    rating: {
        type: Number,
        default: 50
    },
    ranking: {
        type: String,
        default: 'beginner'
    },
    packageType: {
        type: String,
        default: 'free',
        required: true
    },
    account_status: {
        type: String,
        default: 'active',
        required: true
    },
    sub_date: String,
    sub_expiry: String,
    walletBalance: Number,
    address: String,
    bio: String,
    photoUrl: String,
    public_id: String,
    profession: String,
    cvUrl: String,
    account_no: String,
    bank_name: String,
    categoryTags:[categorySchema],
    followers:[userIdSchema],
    following:[userIdSchema],
};


let User = new Schema(fields, { timestamps: true });
    User.index({name: 'text',phone_number: 1, profession: 'text'});
module.exports = mongoose.model('User', User);