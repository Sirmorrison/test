// let mongoose = require("mongoose");
// let Schema = mongoose.Schema;
//
// let userIdField = require('./userId');
// let userIdSchema = new Schema(userIdField ,{timestamps: true});
//
// let commentFields = {
//     answer: {
//         type: String,
//         required: true
//     },
//     answeredBy: {
//         type: mongoose.Schema.Types.String,
//         ref: 'User',
//         required: true
//     },
//     question: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Question',
//         required: true
//     },
//     rating: [ratingSchema],
//     views: [userIdSchema],
//     likes: [userIdSchema],
//     dislikes: [userIdSchema],
//
// };
//
// let Comment = new Schema(commentFields,{timestamps: true});
// module.exports = mongoose.model('Comment', Comment);