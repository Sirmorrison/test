const express = require('express');
const router = express.Router();
let moment = require('moment');
const unirest = require("unirest"); //unirest is an http request library so any other preferred library can be used.

let User = require('../../models/user');
const config = require('../../config');
const Transaction = require('../../models/transactions');
let Admin = require('../../models/admin_user');
let Package = require('../../models/packages');
const protector = require('../../middlewares/protector');
let validator = require('../../utils/validator');


/*** END POINT FOR GETTING PLAN PACKAGES BY ALL USER */
router.get('/packages', function (req, res) {

    Package.find({}, {plan:1, details:1, chat:1, stories: 1, answers: 1, duration: 1}
    ,function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(result);
    })
});

router.post('/', protector.protect, function (req, res) {

    let txref = req.body.reference,
        packageId = req.body.packageId,
        userId = req.user.id;

    if (typeof(txref) !== 'string' || txref.trim() === 0) {
        return res.badRequest('Reference is required and cannot be empty');
    }

    Package.findOne({_id: packageId}, function (err, pack) {
        if (err) {
            console.log(err)
            return res.badRequest('something happened');
        }
        if (!pack) {
            return res.badRequest('no package plan found with details provided');
        }
        if (pack.plan === 'free') {

            let data = {
                'subscription.sub_date': Date.now(),
                'subscription.sub_expiry': 'never',
                'subscription.planId': pack._id
            };

            updateUser(userId, data, function (err, user) {
                if (err) {
                    console.log(err)
                    return res.badRequest('something happened');
                }

                res.success('plan updated successfully')
            })
        }else {
            if (txref) {
                verifyTransaction(config, txref, function (err, result) {
                    if (err) {
                        console.log(err)
                        return res.badRequest('something happened');
                    }
                    if (pack.subscription.amount !== result.amount || pack.subscription.currency !== result.currency) {
                        return res.badRequest('amount or currency paid does not correspond to the plan details provided');
                    }

                    let sub_date = moment(result.created),
                        sub_expiry = moment(result.created).add(30, 'days'),
                        data = {
                            'subscription.sub_date': sub_date,
                            'subscription.sub_expiry': sub_expiry,
                            'subscription.planId': pack._id
                        };

                    updateUser(userId, data, function (err, info) {
                        if (err) {
                            res.badRequest(err);
                        }

                        let infos = {
                            sub_date: info.subscription.sub_date,
                            sub_expiry: info.subscription.sub_expiry,
                            message: 'your subscription was successful'
                        };

                        return res.success(infos)
                    })
                })
            }else {


        }
        createWalletTransaction(response, userId, function (errorMessage, userInfo) {
            if (errorMessage) {
                return callback(errorMessage);
            }
            console.log(userInfo);

            let sub_date = moment(response.body.data[0].created);
            let sub_expiry = moment(response.body.data[0].created).add(30, 'days');
            let amount = response.body.data[0].amount;
            let currency = response.body.data[0].currency;

            console.log(amount);
            Package.findOne({'details.amount': amount, 'details.currency':currency}, function (err, info){
                if (err){
                    console.log(err);
                    return res.badRequest('something went wrong')
                }
                if(!info){
                    return res.badRequest('no package found with amount paid')
                }

                let data = {
                    sub_date: sub_date,
                    sub_expiry: sub_expiry,
                    'subscription.plan' : info.plan
                };

                updateUser(userId, data, function (errorMessage, info) {
                    if (errorMessage) {
                        res.badRequest(errorMessage);
                    }
                    let data = {
                        sub_date : info.sub_date,
                        sub_expiry: info.sub_expiry,
                        packageType: info.packageType,
                        message: 'your subscription to '+ info.packageType+' user plan was successful'
                    };

                    res.success(data)
                })
            });
        })
    }
    });

});

/*** END POINT FOR UPDATING USER PROFILE OF CURRENTLY SIGNED UP USER */
router.post('/update', function(req, res){

    let name = req.body.name,
        company = req.body.company,
        bio = req.body.bio,
        role = req.body.role,
        packageId = req.body.packageId,
        phone_number = req.body.phone_number,
        profession = req.body.profession;

    if (!(name || company || packageId || role || phone_number || bio || category || profession )){
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let profile = {};

    if (bio){
        let vBio = validator.isSentence(res, bio);
        if(!vBio) return;
        profile.bio = bio;
    }
    if (company){
        let vBio = validator.isSentence(res, company);
        if(!vBio) return;
        profile.company = company;
    }
    if (phone_number){
        let vBio = validator.isValidPhoneNumber(res, phone_number);
        if(!vBio) return;
        profile.phone_number = phone_number;
    }
    if (name){
        let fullName = validator.isFullname(res, name);
        if(!fullName) return;
        profile.name = name;
    }
    if (profession){
        let fullName = validator.isWord(res, profession);
        if(!fullName) return;
        profile.profession = profession;
    }
    if (category) {
        //remove duplicates before proceeding
        arrayUtils.removeDuplicates(category);

        let validated = validator.isCategory(res, category);
        if (!validated) return;
        console.log(validated)

        profile.categoryTags = [];
        for (let i = 0; i < category.length; i++) {
            let cateId = category[i];

            if (typeof(cateId) !== "string") {
                return res.badRequest("category IDs in tagged array must be string");
            }

            profile.categoryTags.push({categoryId: cateId});
        }
    }
    if (role){
        let address1 = validator.isSentence(res, role);
        if(!address1) return;
        profile.role = role;
    }

    console.log(profile)

    User.findByIdAndUpdate(req.user.id, {$set: profile}, {new: true}, function(err, user) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }
        if (!user) {
            return res.badRequest("User profile not found please be sure you are still logged in");
        }

        User.populate(user, {
                'path': 'followers.userId following.userId categoryTags.categoryId',
                'select': 'name photoUrl bio title'
            }, function (err, user) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                let info = {
                    profession: user.profession,
                    photo: user.photoUrl,
                    name: user.name,
                    email: user.email,
                    phone_number: user.phone_number,
                    address: user.address,
                    bio: user.bio,
                    followers: user.followers,
                    following: user.following,
                    category: user.categoryTags
                };

                if (name) {
                    let token = req.body.token || req.query.token || req.headers['x-access-token'];
                    firebase.updateProfile(token, name, function (err) {
                        if (err) {
                            console.log(err);
                        }

                        res.success(info);
                    });
                }
                else {
                    res.success(info);
                }
            }
        );
    })
});

/*** END POINT FOR UPDATING USER PROFILE OF CURRENTLY SIGNED UP USER */
router.post('/update_plan', function(req, res){

    let name = req.body.name,
        company = req.body.company,
        bio = req.body.bio,
        role = req.body.role,
        category = req.body.category,
        packageId = req.body.packageId,
        phone_number = req.body.phone_number,
        profession = req.body.profession;

    if (!(name || company || packageId || role || phone_number || bio || category || profession )){
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let profile = {};

    if (bio){
        let vBio = validator.isSentence(res, bio);
        if(!vBio) return;
        profile.bio = bio;
    }
    if (packageId){
        let vBio = validator.isValidPackage(res, packageId);
        if(!vBio) return;
        profile.package = packageId;
    }
    if (company){
        let vBio = validator.isSentence(res, company);
        if(!vBio) return;
        profile.company = company;
    }
    if (phone_number){
        let vBio = validator.isValidPhoneNumber(res, phone_number);
        if(!vBio) return;
        profile.phone_number = phone_number;
    }
    if (name){
        let fullName = validator.isFullname(res, name);
        if(!fullName) return;
        profile.name = name;
    }
    if (profession){
        let fullName = validator.isWord(res, profession);
        if(!fullName) return;
        profile.profession = profession;
    }
    if (category) {
        //remove duplicates before proceeding
        arrayUtils.removeDuplicates(category);

        let validated = validator.isCategory(res, category);
        if (!validated) return;
        console.log(validated)

        profile.categoryTags = [];
        for (let i = 0; i < category.length; i++) {
            let cateId = category[i];

            if (typeof(cateId) !== "string") {
                return res.badRequest("category IDs in tagged array must be string");
            }

            profile.categoryTags.push({categoryId: cateId});
        }
    }
    if (role){
        let address1 = validator.isSentence(res, role);
        if(!address1) return;
        profile.role = role;
    }

    console.log(profile)

    User.findByIdAndUpdate(req.user.id, {$set: profile}, {new: true}, function(err, user) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }
        if (!user) {
            return res.badRequest("User profile not found please be sure you are still logged in");
        }

        User.populate(user, {
                'path': 'followers.userId following.userId categoryTags.categoryId',
                'select': 'name photoUrl bio title'
            }, function (err, user) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                let info = {
                    profession: user.profession,
                    photo: user.photoUrl,
                    name: user.name,
                    email: user.email,
                    phone_number: user.phone_number,
                    address: user.address,
                    bio: user.bio,
                    followers: user.followers,
                    following: user.following,
                    category: user.categoryTags
                };

                if (name) {
                    let token = req.body.token || req.query.token || req.headers['x-access-token'];
                    firebase.updateProfile(token, name, function (err) {
                        if (err) {
                            console.log(err);
                        }

                        res.success(info);
                    });
                }
                else {
                    res.success(info);
                }
            }
        );
    })
});

function updateUser(userId, data, callback){

    User.findByIdAndUpdate(userId, {$set: data}, {new: true}, function (err, info) {
        if (err) {
            console.log("This is verification error: ", err);
            return callback("Something unexpected happened");
        }
        if (!info) {
            return callback("no user found");
        }

        return callback(null, info)
    });
}

function verifyTransaction(config, txref, callback) {
    let payload = {
        "SECKEY": config.rave,
        "txref": txref,
        "include_payment_entity": 1
    };

    let server_url = "https://ravesandboxapi.flutterwave.com/flwv3-pug/getpaidx/api/xrequery";
//please make sure to change this to production url when you go live

    unirest.post(server_url)
        .headers({'Content-Type': 'application/json'})
        .send(payload)
        .end(function (response) {
            if (response.error){
                console.log(response.error);
                return callback('something unexpected happened')
            }
            //check status is success.
            if (response.body.data[0].status === "successful" && response.body.data[0].chargecode === '00') {
                return callback(null, response.body.data[0])
            }

            return callback('something happened')
        })
}

function createWalletTransaction(response, userId, callback) {
    let data ={
        'deposit.amount' : response.body.data[0].amount,
        'deposit.currency' : response.body.data[0].currency,
        status : response.body.data[0].status,
        reason : 'wallet crediting',
        depositedBy : userId
    };

    Transaction.create(data, function (err, info) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        Admin.updateOne(
            {role: 'general'},
            {$inc: {'walletBalance.amount': response.body.data[0].amount}},
            function (err, f) {
                if (err) {
                    console.log(err);
                }
                console.log(f);
            });

        return callback(null, info)
    })
}

module.exports = router;