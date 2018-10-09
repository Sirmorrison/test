let mongoose = require("mongoose");
let Schema = mongoose.Schema;


let fields = {
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
    status:{
        type: String,
        required: true
    },
    reason:{
        type: String,
        required: true
    },
    receiptId: String,
    depositedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User'
    },
    receivedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User'
    }
};

let Transactions = new Schema(fields, { timestamps: true });
module.exports = mongoose.model('Transactions', Transactions);