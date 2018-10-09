const express = require('express');
const router = express.Router();
const unirest = require("unirest");

let validator = require('../../utils/validator'),
    User = require('../../models/user');
let config = require("../../config.js");

/*** END POINT FOR GETTING A LIST BANKS FROM RAVE FOR TRANSFER BY A USER */
router.get('/bank_list', function (req, res) {

    let  url = 'https://ravesandboxapi.flutterwave.com/banks'; //please make sure to change this to production url when you go live
    unirest.get(url)
        .headers({'Content-Type': 'application/json'})
        .send({})
        .end(function (response) {
            if (response.error) {
                console.log(response.error);
                return res.badRequest(response.error)
            }

            res.success(response.body.data)
        }
    )
});

/*** END POINT FOR POSTING ACCOUNT DETAILS BY CURRENTLY LOGGED IN USER */
router.get('/', function(req, res) {

    let id = req.user.id;
    User.findOne({_id: id}, function (err, user) {
        if (err) {
            console.log(err)
            return res.badRequest('something happened')
        }
        if(!user){
            return res.badRequest('no user found with details provided')
        }

        res.success({account_details: user.account_details})
    })
});

/*** END POINT FOR POSTING ACCOUNT DETAILS BY CURRENTLY LOGGED IN USER */
router.get('/:accountId', function(req, res) {

    let id = req.user.id,
        accountId = req.params.accountId;

    User.findOne({_id: id}, function (err, user) {
        if (err) {
            console.log(err)
            return res.badRequest('something happened')
        }
        if(!user){
            return res.badRequest('no user found with details provided')
        }

        res.success({account_details: user.account_details.id(accountId)});
    })
});

/*** END POINT FOR POSTING ACCOUNT DETAILS BY CURRENTLY LOGGED IN USER */
router.post('/', function(req, res) {

    let account_number = req.body.account_number,
        destbankcode = req.body.destbankcode,
        account_name = req.body.account_name,
        bankName = req.body.bankName,
        SwiftCode = req.body.SwiftCode,
        RoutingNumber = req.body.RoutingNumber,
        id = req.user.id;

    if(destbankcode){
        let v = validator.isWord(res, account_number) &&
                validator.isSentence(res, bankName)&&
                validator.isWord(res, destbankcode);
        if (!v) return;

        let data = {
            "recipientaccount": account_number,
            "destbankcode": destbankcode,
            "PBFPubKey": config.PBFPubKey
        };

        let url = 'https://ravesandboxapi.flutterwave.com/flwv3-pug/getpaidx/api/resolve_account'; //please make sure to change this to production url when you go live
        unirest.post(url)
            .headers({'Content-Type': 'application/json'})
            .send(data)
            .end(function (response) {
                if (response.error) {
                    console.log(response.error.code);
                    return res.badRequest(response.error)
                }
                if(response.body.data.data.accountnumber === null || response.body.data.data.accountname === null){
                    return response.success('sorry account information could not be obtained please try again')
                }
                let dat = {
                    account_number: response.body.data.data.accountnumber,
                    account_name: response.body.data.data.accountname,
                    bank_code: destbankcode,
                    bankName: bankName
                };
                updateUser(id, dat, function (err, user) {
                    if (err) {
                        return res.badRequest(err)
                    }

                    res.success(user)
                })
            })
    }else{
        let v = validator.isWord(res, account_number) &&
                validator.isWord(res, SwiftCode)&&
                validator.isSentence(res, bankName)&&
                validator.isSentence(res, account_name)&&
                validator.isWord(res,RoutingNumber)&&
                validator.isWord(res, destbankcode);
        if (!v) return;

        let dat = {
            'account_details.account_number': account_number,
            'account_details.account_name': account_name,
            'account_details.bank_code': destbankcode,
            'account_details.bankName': bankName,
            'account_details.SwiftCode': SwiftCode,
            'account_details.RoutingNumber': RoutingNumber,
        };

        updateUser(id, dat, function (err, user) {
            if (err) {
                return res.badRequest(err)
            }

            res.success(user)
        })
    }
});

/*** END POINT FOR DELETING ACCOUNT DETAILS FROM ACCOUNT NUMBER BY CURRENTLY LOGGED IN USER */
router.delete('/:accountId', function(req, res) {

    let id = req.user.id,
        accountId = req.params.accountId;

    let updateOperation = {
        '$pull': {
            'account_details': {
                "$elemMatch": {
                    "_id": accountId
                }
            }
        }
    };

    User.update({_id: id}, updateOperation, function (err, g) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }
        res.success('account information deleted successfully')
    });
});

function updateUser(id, dat, callback){
    User.findOne({_id: id}, function(err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("User profile not found please be sure you are still logged in");
        }
        user.account_details.push(dat);
        user.save(function (err, profile) {
            if (err) {
                console.log(err);
                return callback("Something unexpected happened");
            }
            let info = {
                account_details: profile.account_details
            };

            return callback(null, info)
        });
    })
}

module.exports = router;