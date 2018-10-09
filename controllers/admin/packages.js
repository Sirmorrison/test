const express = require('express');
const router = express.Router();

const Admin = require('../../models/admin_user');
const Package = require('../../models/packages');
const validator = require('../../utils/validator');

/*** END POINT FOR GETTING BUSINESS CATEGORIES BY USER */
router.get('/plan',allow('pricing'), function (req, res) {

    Package.find({}, {postedBy: 0, __v: 0, 'stories.commission': 0, 'answers.commission': 0, question: 0,'chat.commission': 0},
        function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(result);
    })
});

/*** END POINT FOR GETTING BUSINESS CATEGORIES BY USER */
router.get('/commission', allow('pricing'), function (req, res) {

    Package.find({}, {plan: 1, 'stories.commission': 1, 'answers.commission': 1, question: 1,'chat.commission': 1},
        function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            res.success(result);
        })
});

/*** END POINT FOR CREATING PLAN CATEGORIES BY ADMIN USER */
router.post('/', allow('pricing'),function (req, res) {
    let userId = req.user.id,
        duration = req.body.duration,
        currency = req.body.currency,
        amount = req.body.amount,
        stories = req.body.stories,
        answers = req.body.answers,
        chat = req.body.chat,
        plan = req.body.plan.toLowerCase();

    let validated = validator.isWord(res, duration) &&
                    validator.isCurrency(res, currency) &&
                    validator.isAmount(res, amount) &&
                    validator.isWord(res, plan) &&
                    validator.isJson(res, chat) &&
                    validator.isJson(res, stories) &&
                    validator.isJsonS(res, answers);
    if (!validated) return;

    let data = {
        'subscription.duration': duration,
        'subscription.amount': amount,
        'subscription.currency': currency,
        plan: plan,
        chat: chat,
        stories: stories,
        answers: answers,
        postedBy: userId
    };

    Package.findOne({plan: plan}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (result) {
            return res.badRequest("A package already exist with this plan: " + plan);
        } else {
            Package.create(data, function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                let info = {
                    packageId: data._id,
                    plan: data.plan,
                    subscription: data.subscription,
                    stories: data.stories,
                    answers: data.answers,
                    chat: data.chat
                };

                res.success(info);
            })
        }
    });
});

/*** END POINT FOR EDITING PLAN CATEGORIES BY ADMIN USER */
router.put('/:packageId', allow('pricing'), function (req, res) {

    let subscription = req.body.subscription,
        stories = req.body.stories,
        answers = req.body.answers,
        chat = req.body.chat,
        plan = req.body.plan;

    if (!(stories || subscription || answers || chat || plan)) {
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let data = {};
    if (chat) {
        let valid = validator.isJson(res, chat);
        if (!valid) return;
        data.chat = chat;
    }
    if (stories) {
        let valid = validator.isJson(res, stories);
        if (!valid) return;
        data.stories = stories;
    }
    if (answers) {
        let valid = validator.isJsonS(res, answers);
        if (!valid) return;
        data.answers = answers;
    }
    if (subscription) {
        let valid = validator.isDetails(res, subscription);
        if (!valid) return;
        data.subscription = subscription;
    }
    if (plan) {
        let pla = plan.toLowerCase();
        let vPT = validator.isWord(res, pla);
        if (!vPT) return;
        data.plan = pla
    }
    Package.findOne({plan: pla}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (result) {
            return res.badRequest("A package already exist with this plan: " + pla);
        } else {
            Package.findOneAndUpdate(
                {_id: req.params.packageId},
                {$set: {plan: pla, data}},
                {new: true}, function (err, cat) {
                    if (err) {
                        console.log(err);
                        return res.serverError("Something unexpected happened");
                    }
                    let info = {
                        packageId: cat._id,
                        plan: cat.plan,
                        subscription: cat.subscription,
                        stories: cat.stories,
                        answers: cat.answers,
                        chat: cat.chat
                    };

                    return res.success(info);
                }
            )
        }
    });
});

/*** END POINT FOR EDITING PLAN CATEGORIES BY ADMIN USER */
router.delete('/:packageId', allow('pricing'), function (req, res) {

    let packageId = req.params.packageId;
    Package.remove({_id: packageId}, function (err, data) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }
        if (!data) {
            console.log(err);
            return res.badRequest("no package found");
        }

        res.success(data, "package deleted successfully");
    })
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

            return res.unauthorized('you are not authorized to perform this action')
        })

    }
}

module.exports = router;