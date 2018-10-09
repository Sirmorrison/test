let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let fields = {
    withdrawDetails:  {
        currency: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    },
    accountDetails: {
        account_name: String,
        account_number: String,
        bank_code: String,
        bankName: String,
        SwiftCode: String,
        RoutingNumber: String,
        country: String
    },
    withdrawBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        required: true,
        enums: (["approved","declined","pending"]),
        default: 'pending'
    },
};

let Withdraws = new Schema(fields, { timestamps: true });
module.exports = mongoose.model('Withdraws', Withdraws);