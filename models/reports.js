let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let reportFields = {
    query:{
        type: String,
        required: true
    },
    report:[],
    viewed: {
        type: Boolean,
        default: false,
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        required:true
    }
};

let Report = new Schema(reportFields, {timestamps: true});
module.exports = mongoose.model('Report', Report);