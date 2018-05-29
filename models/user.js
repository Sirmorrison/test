let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let userIdField = require('./userId');
let userIdSchema = new Schema(userIdField,{timestamps: true});

let ratingFields = require('./ratings');
let ratingSchema = new Schema(ratingFields, {timestamps: true});

let catIdField = require('./cate_tags');
let categorySchema = new Schema(catIdField);

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
    admin: {
        type: Boolean,
        default: false,
        required: true
    },
    address: String,
    bio: String,
    photoUrl: String,
    public_id: String,
    profession: String,
    cvUrl: String,
    rating:[ratingSchema],
    categoryTags:[categorySchema],
    followers:[userIdSchema],
    following:[userIdSchema],
};

let User = new Schema(fields, { timestamps: true });

module.exports = mongoose.model('User', User);