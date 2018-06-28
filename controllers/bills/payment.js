// const express = require('express');
// const router = express.Router();
// let braintree = require('braintree');
//
// const config = require('../../config');
// let gateway = config.gateway;
//
//
// router.get('/clientToken', function (req, res) {
//     gateway.clientToken.generate({}, function (err, response) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
// console.log(response)
//         let clientToken = response.clientToken;
//         res.success(clientToken);
//     });
// });
//
// router.get('/checkouts/:id', function (req, res) {
//     let transactionId = req.params.id;
//     console.log(transactionId);
//
//     gateway.transaction.find(transactionId, function (err, transaction) {
//         console.log(transaction);
//         res.success({transaction: transaction, result: transaction});
//     });
// });
//
//
// router.post("/checkout", function (req, res) {
//     let nonceFromTheClient = req.body.payment_method_nonce,
//         amount = req.body.amount;
//
//     gateway.transaction.sale({
//         amount: '300',
//         paymentMethodNonce: 'fake-valid-nonce',
//         options: {
//             submitForSettlement: true
//         }
//     }, function (err, result) {
//         if (err) {
//             console.log(err);
//             return res.serverError("Something unexpected happened");
//         }
//
//         console.log(result)
//         res.success(result)
//     });
// });
//
// module.exports = router;