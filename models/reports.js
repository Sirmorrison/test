let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let reportFields = {
    report:{
        type: String,
        required: true
    },
    reportedId:{
        type: String,
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