const express = require('express');
const router = express.Router();

const User = require('../../models/user');
const Package = require('../../models/packages');
const validator = require('../../utils/validator');

/*** END POINT FOR GETTING BUSINESS CATEGORIES BY USER */
router.get('/', function (req, res) {

    let userId = req.user.id;
    userVerify(userId, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        console.log(user);

        Package.find({}, {package_name: 1, amount: 1, currency: 1}, function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            res.success(result);
        })
    })
});

/*** END POINT FOR CREATING PLAN CATEGORIES BY ADMIN USER */
router.post('/', function (req, res) {
    let userId = req.user.id,
        currency =req.body.currency.toLowerCase(),
        amount = req.body.amount,
        package_title = req.body.package_title.toLowerCase();

    let validated = validator.isWord(res, package_title)&&
                    validator.isWord(res, currency)&&
                    validator.isNumber(res, amount);
    if(!validated) return;

    let data = {
        currency : currency,
        amount : amount,
        package_title : package_title,
        postedBy: userId
    };

    userVerify(userId, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        console.log(user);

        Package.findOne({title: title},function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            if (result) {
                return res.badRequest("A category already exist with this category Name: " + title);
            } else {
                Package.create(data, function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }

                    let info = {
                        categoryId: data._id,
                        package_title: data.package_title,
                        amount: data.amount,
                        currency: data.currency
                    };

                    res.success(info);
                })
            }
        });
    })
});

/*** END POINT FOR EDITING PLAN CATEGORIES BY ADMIN USER */
router.post('/:packageId', function (req, res) {
    let userId = req.user.id,
        currency = req.body.currency.toLowerCase(),
        amount = req.body.amount,
        package_title = req.body.package_title.toLowerCase();

    if (!(currency || amount || package_title)){
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let data = {};

    if (currency){
        let vCurrency = validator.isWord(res, currency);
        if(!vCurrency) return;
        profile.currency = currency;
    }
    if (amount){
        let validAmount = validator.isNumber(res, amount);
        if(!validAmount) return;
        profile.amount = amount;
    }
    if (package_title){
        let vPT = validator.isWord(res, package_title);
        if(!vPT) return;
        profile.package_title = package_title;
    }

    userVerify(userId, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Package.findOneAndUpdate(
            {_id: req.params.packageId},
            {$set: data},
            {new: true}, function (err, cat) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                let info = {
                    categoryId: data._id,
                    package_title: data.package_title,
                    amount: data.amount,
                    currency: data.currency
                };

                res.success(info);
            }
        )
    })
});

/*** END POINT FOR EDITING PLAN CATEGORIES BY ADMIN USER */
router.post('/:packageId', function (req, res) {
    let userId = req.user.id,
        packageId = req.params.packageId;

    userVerify(userId, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Package.remove({_id: packageId}, function (err, data) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if (!data) {
                console.log(err);
                return res.badRequest("no package found");
            }

            res.success(data);
        })
    })
});

function userVerify(userId, callback) {
    User.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }
        if (user.admin !== true) {
            return callback("You are not Authorized to Perform this Action");
        }

        return callback(null, user)
    })
}

module.exports = router;