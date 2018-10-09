let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");
let admin = require('firebase-admin');

let User = require('../../models/user');
let validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');
let Category = require('../../models/categories');

let serviceAccount = require('../../service_account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://ask-oleum.firebaseio.com'
}, 'admin');


//USERS
/*** END POINT FOR GETTING USER DASHBOARD INFORMATION BY LOGGED IN ADMIN USERS*/
router.get('/dashboard', function (req, res) {

    let userId = req.user.id;
    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        User.aggregate([
            {
                $facet: {
                    "total users": [
                        {$sortByCount: {$sum: 1}}
                    ],
                    "package type": [
                        {$group: {"_id": null, "count": {"$sum": 1}, "data": {"$push": "$$ROOT"}}},
                        {$unwind: "$data"},
                        {
                            $group: {
                                _id: '$data.packageType',
                                count: {$sum: 1},
                                total: {"$first": "$count"}
                            },
                        },
                        {$project: {"count": 1, "percentage": {"$multiply": [{"$divide": [100, '$total']}, "$count"]}}},
                        {$sort: {percentage: -1}}
                    ],
                    'account status': [
                        {
                            $group: {
                                _id: '$account_status',
                                count: {$sum: 1},
                            }
                        }
                    ],
                    'account ranking': [
                        {
                            $group: {
                                _id: '$ranking',
                                count: {$sum: 1},
                            }
                        }
                    ]
                }
            },
        ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            res.success(data);
        });
    });
});

/*** END POINT FOR GETTING USER BY PACKAGE TYPE BY LOGGED IN ADMIN USERS*/
router.get('/user/byName', allow('users'), function (req, res) {

    User.aggregate(
        [
            {
                $project: {
                    category: '$categoryTags.categoryId',
                    followers: {$size: '$followers'},
                    packageType: 1,
                    createdAt: 1,
                    balance: 1,
                    photoUrl: 1,
                    status: 1,
                    name: 1
                }
            },
            {$sort: {name: 1}},
            {$limit: 20}
        ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            User.populate(data, {
                'path': 'category',
                model: 'Categories',
                'select': 'title'
            }, function (err, post) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!post) {
                    return res.success([]);
                }

                res.success(post);
            })
        });
});

/*** END POINT FOR GETTING USER BY PACKAGE TYPE BY LOGGED IN ADMIN USERS*/
router.get('/user/byCategory', allow('users'), function (req, res) {

    User.aggregate(
        [
            {$unwind: {path: "$categoryTags", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    _id: 1,
                    users: 1,
                    followers: {$size: '$followers'},
                    name: 1,
                    photoUrl: 1,
                    createdAt: 1,
                    categoryTags: 1
                }
            },
            {
                $group: {
                    '_id': {
                        category: '$categoryTags.categoryId', userId: '$_id'
                    },
                    createdAt: {$addToSet: '$createdAt'},
                    'account status': {$addToSet: '$status'},
                    followers: {$addToSet: '$followers'},
                    'package type': {$addToSet: '$packageType'},
                    balance: {$addToSet: '$walletBalance'},
                    photoUrl: {$addToSet: '$photoUrl'},
                    name: {$addToSet: '$name'}
                }
            },
            {
                $group: {
                    _id: '$_id.category',
                    users: {
                        $push: {
                            userId: '$_id.userId',
                            createdAt: '$createdAt',
                            'account status': '$status',
                            followers: '$followers',
                            'package type': '$packageType',
                            balance: '$walletBalance',
                            photoUrl: '$photoUrl',
                            name: '$name'
                        }
                    }
                }
            },
            // {$unwind: {path: "$users", preserveNullAndEmptyArrays: true}},

            {$sort: {createdAt: -1}}
        ], function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            User.populate(data, {
                'path': '_id',
                model: 'Categories',
                'select': 'title'
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(data);
            })
        })
});

/*** END POINT FOR GETTING USER BY PACKAGE TYPE BY LOGGED IN ADMIN USERS*/
router.post('/admin/update/:userId', allow('users'), function (req, res) {

    let id = req.params.userId,
        name = req.body.name,
        email = req.body.email,
        phone_number = req.body.phone_number,
        suspended = req.body.suspended,
        password = req.body.password;

    if (!(suspended || email || phone_number || name || password)) {
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let profile = {};

    if (name) {
        let fullName = validator.isFullname(res, name);
        if (!fullName) return;
        profile.name = name;
    }
    if (email) {
        let valid = validator.isValidEmail(res, email);
        if (!valid) return;
        profile.email = email;
    }
    if (suspended) {
        if (suspended === 0 || suspended === '0' || suspended === 'f' || suspended === 'false' || suspended === 'no')
            suspended = false;
        else if (suspended === 1 || suspended === '1' || suspended === 't' || suspended === 'true' || suspended === 'yes')
            suspended = true;

        if (typeof(suspended) !== 'boolean') {
            return res.badRequest('disabled must be boolean that is true or false and its required');
        }

        profile.disabled = suspended;
    }
    if (password) {
        let valid = validator.isValidPassword(res, password);
        if (!valid) return;
        profile.password = password;
    }

    admin.auth().updateUser(id, profile)
        .then(function (userRecord) {
            console.log(userRecord)
            // See the UserRecord reference doc for the contents of userRecord.
            let data = {
                name: userRecord.displayName,
                email: userRecord.email,
            };
            if (userRecord.disabled === false) {
                data.account_status = 'active'
            } else {
                data.account_status = 'suspended'
            }
            if (phone_number) {
                let valid = validator.isValidPhoneNumber(res, phone_number);
                if (!valid) return;

                Admin.findOne({phone_number: phone_number}, function (err, user) {
                    if (err) {
                        console.log(err);
                        return res.serverError("Something unexpected happened");
                    }
                    if (user && user._id !== req.user.id) {
                        return res.badRequest('A user already Exist with Phone Number: ' + phone_number);
                    }
                    if (user && user._id === req.user.id) {
                        return res.badRequest('Phone number already used by You. select a new Phone number you will love to change to');
                    }

                    profile.phone_number = phone_number;
                })
            }

            // if (rating){
            //     let valid = validator.isAdminRating(res, rating);
            //     if(!valid) return;
            //
            //     Admin.findOne({_id: id}, function (err, user) {
            //         if (err) {
            //             console.log(err);
            //             return res.serverError("Something unexpected happened");
            //         }
            //         if (user && user._id !== req.user.id) {
            //             return res.badRequest('A user already Exist with Phone Number: ' + phone_number);
            //         }
            //         if (user && user._id === req.user.id) {
            //             return res.badRequest('Phone number already used by You. select a new Phone number you will love to change to');
            //         }
            //
            //         profile.phone_number = phone_number;
            //     })
            // }

            User.findByIdAndUpdate(id,
                {$set: data},
                {new: true},
                function (err, user) {
                    if (err) {
                        console.log(err);
                        return res.serverError("Something unexpected happened");
                    }
                    let data = {
                        userId: user._id,
                        name: user.displayName,
                        email: user.email,
                        'account status': user.account_status
                    };
                    res.success(data);
                })
        })
        .catch(function (error) {
            console.log("Error updating user:", error);
            if (error) {
                return res.serverError(error);
            }
        });
});

/*** END POINT FOR GETTING USER BY PACKAGE TYPE BY LOGGED IN ADMIN USERS*/
router.post('/user/downgrade/:userId', allow('users'), function (req, res) {

    let id = req.params.userId,
        rating = req.body.ratingPoint;

    let valid = validator.isAdminRating(res, rating);
    if (!valid) return;

    User.update(
        {"_id": id},
        {$inc: {rating: -rating}}, function (err) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            res.success('user downgraded successfully')
        }
    )

});

/*** END POINT FOR GETTING USER BY PACKAGE TYPE BY LOGGED IN ADMIN USERS*/
router.post('/user/upgrade/:userId', allow('users'), function (req, res) {

    let id = req.params.userId,
        rating = req.body.ratingPoint;

    let valid = validator.isAdminRating(res, rating);
    if (!valid) return;

    User.update(
        {"_id": id},
        {$inc: {rating: rating}}, function (err) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            res.success('user upgraded successfully')
        }
    )

});


//ADMIN USER
/*** END POINT FOR GETTING USER BY PACKAGE TYPE BY LOGGED IN ADMIN USERS*/
router.get('/admin/byName', allow('all'), function (req, res) {

    Admin.aggregate(
        [
            {
                $project: {
                    role: '$admin_category',
                    createdAt: 1,
                    photoUrl: 1,
                    name: 1
                }
            },
            {$sort: {name: 1}}
        ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            if (!data) {
                return res.success([]);
            }

            res.success(data);
        })
});

/*** END POINT FOR GETTING USER BY PACKAGE TYPE BY LOGGED IN ADMIN USERS*/
router.get('/admin/byCategory', allow('all'), function (req, res) {

    Admin.aggregate(
        [
            {
                $group: {
                    _id: {
                        category: '$admin_position', userId: '$_id'
                    },
                    createdAt: {$addToSet: '$createdAt'},
                    photoUrl: {$addToSet: '$photoUrl'},
                    name: {$addToSet: '$name'}
                }
            },
            {
                $group: {
                    _id: '$_id.category',
                    users: {
                        $push: {
                            userId: '$_id.userId',
                            createdAt: '$createdAt',
                            photoUrl: '$photoUrl',
                            name: '$name'
                        }
                    }
                }
            },
            {$sort: {createdAt: -1}}
        ],
        function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            res.success(data);
        })
});

/*** END POINT FOR GETTING USER BY PACKAGE TYPE BY LOGGED IN ADMIN USERS*/
router.post('/admin/update/:userId', allow('all'), function (req, res) {

    let id = req.params.userId,
        name = req.body.name,
        email = req.body.email,
        phone_number = req.body.phone_number,
        suspended = req.body.suspended,
        password = req.body.password;

    if (!(suspended || email || phone_number || name || password)) {
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let profile = {};

    if (name) {
        let fullName = validator.isFullname(res, name);
        if (!fullName)
            return;
        profile.name = name;
    }
    if (email) {
        let valid = validator.isValidEmail(res, email);
        if (!valid) return;
        profile.email = email;
    }
    if (suspended) {
        if (suspended === 0 || suspended === '0' || suspended === 'f' || suspended === 'false' || suspended === 'no')
            suspended = false;
        else if (suspended === 1 || suspended === '1' || suspended === 't' || suspended === 'true' || suspended === 'yes')
            suspended = true;

        if (typeof(suspended) !== 'boolean') {
            return res.badRequest('disabled must be boolean that is true or false and its required');
        }

        profile.disabled = suspended;
    }
    if (password) {
        let valid = validator.isValidPassword(res, password);
        if (!valid) return;
        profile.password = password;
    }

    admin.auth().updateUser(id, profile)
        .then(function (userRecord) {
            console.log(userRecord)
            // See the UserRecord reference doc for the contents of userRecord.
            let data = {
                name: userRecord.displayName,
                email: userRecord.email,
            };
            if (userRecord.disabled === false) {
                data.account_status = 'active'
            } else {
                data.account_status = 'suspended'
            }
            if (phone_number) {
                let valid = validator.isValidPhoneNumber(res, phone_number);
                if (!valid) return;

                Admin.findOne({phone_number: phone_number}, function (err, user) {
                    if (err) {
                        console.log(err);
                        return res.serverError("Something unexpected happened");
                    }
                    if (user && user._id !== req.user.id) {
                        return res.badRequest('A user already Exist with Phone Number: ' + phone_number);
                    }
                    if (user && user._id === req.user.id) {
                        return res.badRequest('Phone number already used by You. select a new Phone number you will love to change to');
                    }

                    profile.phone_number = phone_number;
                })
            }

            // if (rating){
            //     let valid = validator.isAdminRating(res, rating);
            //     if(!valid) return;
            //
            //     Admin.findOne({_id: id}, function (err, user) {
            //         if (err) {
            //             console.log(err);
            //             return res.serverError("Something unexpected happened");
            //         }
            //         if (user && user._id !== req.user.id) {
            //             return res.badRequest('A user already Exist with Phone Number: ' + phone_number);
            //         }
            //         if (user && user._id === req.user.id) {
            //             return res.badRequest('Phone number already used by You. select a new Phone number you will love to change to');
            //         }
            //
            //         profile.phone_number = phone_number;
            //     })
            // }

            User.findByIdAndUpdate(id,
                {$set: data},
                {new: true},
                function (err, user) {
                    if (err) {
                        console.log(err);
                        return res.serverError("Something unexpected happened");
                    }
                    let data = {
                        userId: user._id,
                        name: user.displayName,
                        email: user.email,
                        'account status': user.account_status
                    };
                    res.success(data);
                })
        })
        .catch(function (error) {
            console.log("Error updating user:", error);
            if (error) {
                return res.serverError(error);
            }
        });
});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/admin/:userId', allow('all'), function (req, res) {

    let id = req.params.userId;
    admin.auth().deleteUser(id)
        .then(function () {
            console.log("Successfully deleted user");
            User.findByIdAndUpdate(id,
                {$set: {account_status: 'deleted'}},
                {new: true},
                function (err) {
                    if (err) {
                        console.log(err);
                        return res.serverError("Something unexpected happened");
                    }

                    res.success("Successfully deleted user");
                })
        })
        .catch(function (error) {
            console.log("Error deleting user:", error);
            if (err) {
                return res.badRequest("Some error occurred");
            }
        });

});

function allow(admin_function) {
    return function (req, res, next) {
        let userId = req.user.id;
        Admin.findById(userId, function (err, user) {
            if(err){
                console.log(err);
                return res.badRequest('something happened')
            }
            if (user) {
                let that = user.admin_function;
                for (let i = 0; i < that.length; i++) {
                    if (that[i].match(admin_function) || user.role === 'general') {
                        req.user = user;

                        return next();
                    }
                }
            }


            // if (user) {
            //     let that = user.admin_function;
            //     console.log(that)
            //
            //     for (let i = 0; i < that.length; i++) {
            //         console.log(that[i].indexOf(admin_function.split(',')))
            //
            //         if (that[i].indexOf(admin_function.split(',')) >= 0) {
            //             console.log(user)
            //
            //             req.user = user;
            //             return next();
            //         }
            //     }
            // }
            return res.unauthorized('you are not authorized to perform this action')
        })

    }
}

function userVerify(userId, callback) {
    Admin.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }
       
        return callback(null, user)
    })
}

module.exports = router;