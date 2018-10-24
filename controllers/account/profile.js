const express = require('express');
const router = express.Router();
let fs = require('fs');

const arrayUtils = require('../../utils/array');

const config = require('../../config'),
      FirebaseAuth = require('firebaseauth'),
      firebase = new FirebaseAuth(config.FIREBASE_API_KEY);

const cloudinary = require('cloudinary');
      cloudinary.config(config.cloudinary);

let validator = require('../../utils/validator'),
    User = require('../../models/user'),
    Question = require('../../models/question'),
    Blog = require('../../models/blog'),
    Answers = require('../../models/answers'),
    Story = require('../../models/story'),
    Packages = require('../../models/packages');


/*** END POINT FOR GETTING PERSONAL PROFILE BY CURRENTLY LOGGED IN USER */
router.get('/', function(req, res) {

    let id = req.user.id,
        userId = req.query.userId;

    if (userId) {
        ranking(userId, function (err, user) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            userProfile(user._id, function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                }

                let info = {
                    _id: data[0]._id,
                    email: data[0].email,
                    phone_number: data[0].phone_number,
                    company: data[0].company,
                    role: data[0].role,
                    bio: data[0].bio,
                    profile_picture: data[0].profile_picture,
                    cv_Urls: data[0].cv_Urls,
                    profession: data[0].profession,
                    name: data[0].name,
                    ranking: data[0].ranking,
                    address: data[0].address,
                    total_stories: data[0].total_stories,
                    total_questions: data[0].total_questions,
                    total_blogs: data[0].total_blogs,
                    total_Following: data[0].total_Following,
                    total_Followers: data[0].total_Followers,
                };
                console.log(info)

                return res.success(info)
            })
        })
    } else {
        ranking(id, function (err, user) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            userProfile(user._id, function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                }

                return res.success(data);
                //  User.aggregate([
                //     {$match: {'_id': user._id}},
                //      {
                //          $lookup: {
                //              from: "stories",
                //              localField: "_id",
                //              foreignField: "postedBy",
                //              as: "stories"
                //          }
                //      },
                //      {
                //          $lookup: {
                //              from: "questions",
                //              localField: "_id",
                //              foreignField: "postedBy",
                //              as: "questions"
                //          }
                //      },
                //      {
                //          $lookup: {
                //              from: "answers",
                //              localField: "_id",
                //              foreignField: "answeredBy",
                //              as: "answers"
                //          }
                //      },
                //      {
                //          $lookup: {
                //              from: "blogs",
                //              localField: "_id",
                //              foreignField: "postedBy",
                //              as: "blogs"
                //          }
                //      },
                //     {
                //         $project: {
                //             email: 1,
                //             'categoryTags.categoryId': 1,
                //             phone_number: 1,
                //             referralCode: 1,
                //             company: 1,
                //             role: 1,
                //             bio: 1,
                //             profile_picture: 1,
                //             cv_Urls: 1,
                //             profession: 1,
                //             name: 1,
                //             ranking: 1,
                //             createdAt: 1,
                //             address: 1,
                //             packageType: 1,
                //             total_stories: {$size: "$stories"},
                //             total_questions: {$size: "$questions"},
                //             total_blogs: {$size: "$blogs"},
                //             total_Following: {$size: "$following"},
                //             total_Followers: {$size: "$followers"},
                //         }
                //     }
                // ], function (err, data) {
                //     if (err) {
                //         console.log(err);
                //         return res.badRequest("Something unexpected happened");
                //     }
                //      if (!user) {
                //          return res.badRequest("YOU NEED TO BE A REGISTERED USER TO VIEW GET ACCESS");
                //      }
                //
                //     User.populate(data, {
                //             'path': 'categoryTags.categoryId',
                //             'select': 'title'
                //         },
                //
                //         function (err, user) {
                //
                //             if (err) {
                //                 console.log(err);
                //                 return res.badRequest("Something unexpected happened");
                //             }
                //
                //             res.success(user);
                //         });
                // });
            })
        });
    }
});

// /*** END POINT FOR GETTING PROFILE OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
// router.get('/:userId', function(req, res) {
//
//     let id = req.params.userId;
//     ranking(id, function (err, user) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//         User.aggregate([
//             {$match: {'_id': user._id}},
//             {
//                 $lookup: {
//                     from: "stories",
//                     localField: "_id",
//                     foreignField: "postedBy",
//                     as: "stories"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "questions",
//                     localField: "_id",
//                     foreignField: "postedBy",
//                     as: "questions"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "answers",
//                     localField: "_id",
//                     foreignField: "answeredBy",
//                     as: "answers"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "blogs",
//                     localField: "_id",
//                     foreignField: "postedBy",
//                     as: "blogs"
//                 }
//             },
//             {
//                 $project: {
//                     email: 1,
//                     'categoryTags.categoryId': 1,
//                     phone_number: 1,
//                     bio: 1,
//                     photoUrl: 1,
//                     profession: 1,
//                     name: 1,
//                     ranking: 1,
//                     createdAt: 1,
//                     address: 1,
//                     packageType: 1,
//                     total_stories: {$size: "$stories"},
//                     total_questions: {$size: "$questions"},
//                     total_answers: {$size: "$answers"},
//                     total_blogs: {$size: "$blogs"},
//                     'total_Following': {$size: "$following"},
//                     'total_Followers': {$size: "$followers"},
//                 }
//             },
//         ], function (err, data) {
//             if (err) {
//                 console.log(err);
//                 return res.badRequest("Something unexpected happened");
//             }
//             if (!data) {
//                 return res.badRequest("YOU NEED TO BE A REGISTERED USER TO VIEW GET ACCESS");
//             }
//             User.populate(data, {
//                     'path': 'categoryTags.categoryId',
//                     'select': 'title'
//                 },
//
//                 function (err, user) {
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//
//                     res.success(user);
//                 });
//         });
//     });
// });

/*** END POINT FOR GETTING STORIES OF A CURRENTLY LOGGED IN USER */
router.get('/story', function (req, res) {

    let id = req.user.id,
        userId = req.query.userId;

    if(userId){
        story(userId, function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest(err);
            }
            res.success(data);
        })
    }else {
        story(id, function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest(err);
            }
            res.success(data);
        })
    }

    // Story.aggregate([
    //     {$match: {'postedBy': id}},
    //     {
    //         $project: {
    //             answers: {$size: "$answers"},
    //             comments: {$size: '$comments'},
    //             views: 1,
    //             "category.categoryId": 1,
    //             createdAt: 1,
    //             postedBy: 1,
    //             question: 1
    //         }
    //     },
    //     {$sort: {date: -1}},
    // ], function (err, data) {
    //     console.log(data);
    //     if (err) {
    //         console.log(err);
    //         return res.badRequest("Something unexpected happened");
    //     }
    //
    //     Story.populate(data, {
    //             'path': 'postedBy category.categoryId',
    //             'select': 'name photoUrl ranking title'
    //         },
    //
    //         function (err, post) {
    //             if (err) {
    //                 console.log(err);
    //                 return res.badRequest("Something unexpected happened");
    //             }
    //
    //             res.success(post);
    //         }
    //     );
    // });
});

/*** END POINT FOR GETTING STORIES OF A CURRENTLY LOGGED IN USER */
router.get('/question', function (req, res) {

    let id = req.user.id,
        userId = req.query.userId;

    if(userId){
        console.log(userId)
        console.log('id was provided')
        question(userId, function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest(err);
            }

            res.success(data);
        })
    }else {
        console.log('no id was provided')
        console.log(id)
        question(id, function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest(err);
            }

            res.success(data);
        })
    }

    // Story.aggregate([
    //     {$match: {'postedBy': id}},
    //     {
    //         $project: {
    //             answers: {$size: "$answers"},
    //             comments: {$size: '$comments'},
    //             views: 1,
    //             "category.categoryId": 1,
    //             createdAt: 1,
    //             postedBy: 1,
    //             question: 1
    //         }
    //     },
    //     {$sort: {date: -1}},
    // ], function (err, data) {
    //     console.log(data);
    //     if (err) {
    //         console.log(err);
    //         return res.badRequest("Something unexpected happened");
    //     }
    //
    //     Story.populate(data, {
    //             'path': 'postedBy category.categoryId',
    //             'select': 'name photoUrl ranking title'
    //         },
    //
    //         function (err, post) {
    //             if (err) {
    //                 console.log(err);
    //                 return res.badRequest("Something unexpected happened");
    //             }
    //
    //             res.success(post);
    //         }
    //     );
    // });
});

// /*** END POINT FOR GETTING QUESTIONS OF A CURRENTLY LOGGED IN USER */
// router.get('/story/:userId', function (req, res) {
//
//     let id = req.params.userId;
//     Story.aggregate([
//         {$match: {'postedBy': id}},
//         {
//             $project: {
//                 answers: {$size: "$answers"},
//                 comments: {$size: '$comments'},
//                 views: 1,
//                 "category.categoryId": 1,
//                 createdAt: 1,
//                 postedBy: 1,
//                 question: 1
//             }
//         },
//         {$sort: {date: -1}},
//     ], function (err, data) {
//         console.log(data);
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Story.populate(data, {
//                 'path': 'postedBy category.categoryId',
//                 'select': 'name photoUrl  ranking title'
//             },
//
//             function (err, post) {
//
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//
//                 res.success(post);
//             }
//         );
//     });
// });

/*** END POINT FOR GETTING BLOG POST OF A CURRENTLY LOGGED IN USER */
router.get('/blog', function (req, res) {

    let id = req.user.id,
        userId =req.query.userId;

    if(userId){
        blog(userId, function (err, data) {
            if(err){
                return res.badRequest(err)
            }

            return res.success(data)
        })
    }else{
        blog(id, function (err, data) {
            if(err){
                return res.badRequest(err)
            }

            return res.success(data)
        })
    }
});

// /*** END POINT FOR GETTING QUESTIONS OF A CURRENTLY LOGGED IN USER */
// router.get('/blog/:userId', function (req, res) {
//
//     let id = req.params.userId;
//     Blog.aggregate([
//         {$match: {'postedBy': id}},
//         {
//             $project: {
//                 answers: {$size: "$answers"},
//                 comments: {$size: '$comments'},
//                 views: 1,
//                 "category.categoryId": 1,
//                 createdAt: 1,
//                 postedBy: 1,
//                 question: 1
//             }
//         },
//         {$sort: {date: -1}},
//     ], function (err, data) {
//         console.log(data);
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Blog.populate(data, {
//                 'path': 'postedBy category.categoryId',
//                 'select': 'name photoUrl  ranking title'
//             },
//
//             function (err, post) {
//
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//
//                 res.success(post);
//             }
//         );
//     });
// });

/*** END POINT FOR GETTING ANSWERS OF A CURRENTLY LOGGED IN USER */
router.get('/answer', function (req, res) {

    let id = req.user.id,
        userId = req.query.userId;

    if(userId){
        answer(userId, function (err, data) {
            if(err){
                return res.badRequest(err)
            }

            return res.success(data)
        })
    }else{
        answer(id, function (err, data) {
            if(err){
                return res.badRequest(err)
            }

            return res.success(data)
        })
    }
});

// /*** END POINT FOR GETTING ANSWERS OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
// router.get('/answer/:userId', function (req, res) {
//
//     let id = req.params.userId;
//     Answers.aggregate([
//         {$match: {'answeredBy': id}},
//         {
//             $project: {
//                 // answers: {
//                 //     $map: {
//                 //         input: '$answers',
//                 //         as: "element",
//                 //         in: {
//                 //             answerId: "$$element._id",
//                 //             answeredOn: '$$element.createdAt',
//                 //             answeredBy: '$$element.answeredBy',
//                 //             answer: '$$element.answer',
//                 //             views: "$$element.views",
//                 //             upVotes: {$size: "$$element.likes"},
//                 //             downVotes: {$size: "$$element.dislikes"}
//                 //         }
//                 //     }
//                 // },
//                 answer: 1,
//                 createdAt: 1,
//                 postId: 1,
//                 view: 1,
//                 view_cost: 1,
//                 attachment: 1,
//                 answeredBy: 1,
//                 'total_likes': {$size: "$likes"},
//                 'total_dislikes': {$size: "$dislikes"}
//             }
//         },
//         {$sort: {createdAt: -1}},
//         {$limit: 50}
//     ], function (err, data) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Question.populate(data, {
//                 'path': 'answeredBy postId',
//                 'select': 'name photoUrl email bio question '
//             },
//             function (err, post) {
//
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//
//                 res.success(post);
//             }
//         );
//     });
// });

/*** END POINT FOR GETTING QUESTIONS OF A CURRENTLY LOGGED IN USER */
router.get('/followers', function (req, res) {

    let id = req.user.id,
        userId = req.query.userId;

    if(userId){
        followers(userId, function (err, data) {
            if(err){
                return res.badRequest(err)
            }

            return res.success(data)
        })
    }else{
        followers(id, function (err, data) {
            if(err){
                return res.badRequest(err)
            }

            return res.success(data)
        })
    }
});

// /*** END POINT FOR GETTING QUESTIONS OF A CURRENTLY LOGGED IN USER */
// router.get('/followers/:userId', function (req, res) {
//
//     let id = req.params.userId;
//     User.findOne({_id: id})
//         .populate({
//             path: 'followers.userId',
//             select: 'name ranking photoUrl'
//         })
//         .exec(function (err, result) {
//             if(err){
//                 console.log(err);
//                 return res.badRequest("Something unexpected happened");
//             }
//             if(!result){
//                 return res.badRequest("no user found with details provided");
//             }
//
//             res.success(result.followers)
//         })
// });

/*** END POINT FOR GETTING QUESTIONS OF A CURRENTLY LOGGED IN USER */
router.get('/following', function (req, res) {

    let id = req.user.id,
        userId = req.query.userId;

    if(userId){
        following(userId, function (err, data) {
            if(err){
                return res.badRequest(err)
            }

            return res.success(data)
        })
    }else{
        following(id, function (err, data) {
            if(err){
                return res.badRequest(err)
            }

            return res.success(data)
        })
    }
});

// /*** END POINT FOR GETTING QUESTIONS OF A CURRENTLY LOGGED IN USER */
// router.get('/following/:userId', function (req, res) {
//
//     let id = req.params.userId;
//     User.findOne({_id: id})
//         .populate({
//             path: 'following.userId',
//             select: 'name ranking photoUrl'
//         })
//         .exec(function (err, result) {
//             if(err){
//                 console.log(err);
//                 return res.badRequest("Something unexpected happened");
//             }
//             if(!result){
//                 return res.badRequest("no user found with details provided");
//             }
//
//             res.success(result.following)
//         })
// });

/*** END POINT FOR UPDATING USER PROFILE OF CURRENTLY SIGNED UP USER */
router.post('/update', function(req, res){

    let
        company = req.body.company,
        bio = req.body.bio,
        role = req.body.role,
        phone_number = req.body.phone_number,
        profession = req.body.profession;

    if (!(company || role || phone_number || bio || profession )){
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
        let vBio = validator.isValidPhoneNumber(res, phone_number, req.user.id);
        if(!vBio) return;
        profile.phone_number = phone_number;
    }
    // if (name){
    //     let fullName = validator.isFullname(res, name);
    //     if(!fullName) return;
    //     profile.name = name;
    // }
    if (profession){
        let fullName = validator.isWord(res, profession);
        if(!fullName) return;
        profile.profession = profession;
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

                // if (name) {
                //     let token = req.body.token || req.query.token || req.headers['token'];
                //     console.log(token)
                //     firebase.updateProfile(token, name, function (err) {
                //         if (err) {
                //             console.log(err);
                //         }
                //
                //         res.success(info);
                //     });
                // }
                // else {
                    res.success(info);
                // }
            }
        );
    })
});

/*** END POINT FOR UPDATING USER PROFILE OF CURRENTLY SIGNED UP USER */
router.post('/chat_cost', function(req, res) {

    let amount = req.body.amount,
        currency = req.body.currency,
        userId = req.user.id;

    let valid = validator.isNumber(res, amount)&&
        validator.isWord(res, currency);
    if (!valid) return;

    User.findOne({_id: userId}, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!user || user === null || user === undefined) {
            return res.badRequest("no user found with details provided");
        }
        if (!user.packageType || user.packageType === null || user.packageType === undefined) {
            return res.badRequest("no user package plan setup for this profile");
        }

        let packId = user.packageType;
        chatCost(packId, amount, currency, function (err, info) {
            if (err) {
                return res.badRequest(err);
            }

            let data = {
                'chat.amount' : amount,
                'chat.currency': currency
            };

            user.set(data);
            user.save(function (err, user) {
                if (err) {
                    console.log(err);
                    return res.badRequest('something happened');
                }

                res.success('chat cost updated successfully')
            })
        })
    })
});

/*** END POINT FOR UPDATING PROFILE PICTURE OF CURRENTLY LOGGED IN USER */
router.post('/profile_picture', function(req, res) {
    let file = req.files.null,
        id = req.user.id;

    let validated = validator.isFile(res, file);
    if (!validated) return;
    console.log(validated);

    if (file['type'].split('/')[0] !== 'image') {
        return res.badRequest("file to be uploaded must be an image");
    }

    User.findOne({_id: id}, function (err, user) {
        if (err) {
            return res.badRequest(err);
        }
        if (!user) {
            return res.badRequest('no user found with your login details');
        }
        console.log('first ' + user.profile_picture.length);
        if (user.profile_picture.length === 0) {
            upload(file, function (err, result) {
                if (err) {
                    console.log('it fail here' + err);
                    res.badRequest(err.message);
                }
                console.log(result);
                user.profile_picture.push(result);
                user.save(function (err, user) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('saving user', user);
                    fs.unlink(file.path, function (err, g) {
                        if (err) {
                            console.log(err);
                            return res.badRequest(err);
                        }
                    });

                    res.success(user);
                })
            })
        } else {
            console.log('im here and this is the iss');
            let public_id = user.profile_picture[0].public_id,
                pictureId = user.profile_picture[0]._id;

            cloudinary.v2.uploader.destroy(public_id, {invalidate: true}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                }
                console.log('deleted :', result);
                user.profile_picture.id(pictureId).remove();
                user.save(function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.badRequest('something went wrong');
                    }
                    if (!data){
                        return res.badRequest('something went wrong cause data wasnt found');
                    }
                    upload(file, function (err, result) {
                        if (err) {
                            console.log(err);
                            return res.badRequest(err.message);
                        } else {
                            console.log('uploaded successfully :', result);
                            user.profile_picture.push(result);
                            user.save(function (err, user) {
                                if (err) {
                                    console.log(err);
                                }
                                console.log('saving user', user);
                                fs.unlink(file.path, function (err, g) {
                                    if (err) {
                                        console.log(err);
                                        return res.badRequest(err);
                                    }
                                    console.log(g);
                                });

                                res.success(user);
                            })
                        }
                    })
                })
            })
        }
    })
});

/*** END POINT FOR UPDATING CV INFORMATION OF CURRENTLY LOGGED IN USER */
router.post('/cv', function(req, res) {
    let file = req.files.null,
        id = req.user.id;

    let validated = validator.isFile(res, file);
    if(!validated) return;

    if (file['type'].split('/')[0] === 'audio' || file['type'].split('/')[0] === 'video') {
        return res.badRequest("file to be uploaded must be either pdf, word document, text format only");
    }

    User.findOne({_id: id}, function (err, user) {
        if (err) {
            return res.badRequest(err);
        }
        if (!user) {
            return res.badRequest('no user found with your id: ' + id);
        }
        console.log('first ' + user.cvPublic_id);
        if (user.cv_Urls.length === 0) {
            upload(file, function (err, result) {
                if (err) {
                    console.log('it fail here' + err);
                    res.badRequest(err.message);
                }
                console.log(result);

                user.cv_Urls.push(result);
                user.save(function (err, user) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('saving user', user);
                    fs.unlink(file.path, function (err, g) {
                        if (err) {
                            console.log(err);
                            return res.badRequest(err);
                        }
                    });
                    res.success(user);
                })
            })
        } else {
            console.log('im here and this is the iss');
            let public_id = user.cv_Urls[0].public_id,
                cvId = user.cv_Urls[0]._id;

            cloudinary.v2.uploader.destroy(public_id, {invalidate: true}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                } else {

                    console.log('deleted :', result);
                    user.cv_Urls.id(cvId).remove();
                    user.save(function (err, data) {
                        if (err) {
                            console.log(err);
                            return res.badRequest('something went wrong');
                        }
                        if (!data) {
                            return res.badRequest('something went wrong cause data wasnt found');
                        }
                        upload(file, function (err, result) {
                            if (err) {
                                console.log(err);
                                return res.badRequest(err.message);
                            } else {
                                console.log('uploaded successfully :', result);
                                user.cv_Urls.push(result);
                                user.save(function (err, user) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log('saving user', user);
                                    fs.unlink(file.path, function (err, g) {
                                        if (err) {
                                            console.log(err);
                                            return res.badRequest(err);
                                        }
                                        console.log(g);
                                    });

                                    res.success(user);
                                })
                            }
                        })
                    })
                }
            })
        }
    })
});

/*** END POINT FOR FOR REQUESTING PASSWORD CHANGE BY LOGGED IN USER */
router.post('/edit_password', function(req, res){

    let password = req.body.password;

    let validatedPassword = validator.isValidPassword(res, password);

    if (!validatedPassword)
        return;

    let token = req.body.token || req.query.token || req.headers['x-access-token'];
    firebase.changePassword(token, password, function(err, authData){
        if (err){
            return res.serverError(err.message);
        }

        let info = {
            token: authData.token,
            refreshToken: authData.refreshToken
        };

        res.success(info);
    });
});

function profile(id, callback){
    User.findById(id)
        .populate({
            path: 'followers.userId',
            select: 'name photo email bio'
        })
        .populate({
            path: 'following.userId',
            select: 'name photo email bio'
        })
        .sort({date: -1})
        .exec(function (err, user) {

            if (err) {
                return callback("Something unexpected happened");
            }
            if (!user) {
                return callback("could not find user with id: " + id);
            }
            let info = {
                followers: user.followers,
                following: user.following
            };

            return callback(null, info);
        }
    );
}

function ranking(id, callback){
    User.findById(id, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("could not find user with id: " + id);
        }
        if (user.rating >= 50000000) {
            user.ranking = 'ultimate';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                return callback(null, result)
            })
        }
        else if (user.rating <50000000 && user.rating >=5000000) {
            user.ranking = 'veteran';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                return callback(null, result)
            })
        }
        else if (user.rating < 5000000 && user.rating >=500000) {
            user.ranking = 'expert';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                return callback(null, result)
            })
        }
        else if (user.rating < 500000 && user.rating >=100000) {
            user.ranking = 'professional';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                return callback(null, result)
            })
        }
        else if (user.rating < 100000 && user.rating >=10000) {
            user.ranking = 'proficient';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                return callback(null, result)
            })
        }
        else if (user.rating < 10000 && user.rating >= 1000) {
            user.ranking = 'amateur';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                return callback(null, result)

            })
        }
        else {
            user.ranking = 'beginner';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return badRequest("Something unexpected happened");
                }
                return callback(null, result)
            })
        }
    });
}

function userProfile(id, callback) {
 User.aggregate([
        {$match: {'_id': id}},
         {
             $lookup: {
                 from: "stories",
                 localField: "_id",
                 foreignField: "postedBy",
                 as: "stories"
             }
         },
         {
             $lookup: {
                 from: "questions",
                 localField: "_id",
                 foreignField: "postedBy",
                 as: "questions"
             }
         },
         {
             $lookup: {
                 from: "answers",
                 localField: "_id",
                 foreignField: "answeredBy",
                 as: "answers"
             }
         },
         {
             $lookup: {
                 from: "blogs",
                 localField: "_id",
                 foreignField: "postedBy",
                 as: "blogs"
             }
         },
        {
            $project: {
                email: 1,
                'categoryTags.categoryId': 1,
                phone_number: 1,
                referralCode: 1,
                company: 1,
                role: 1,
                bio: 1,
                profile_picture: 1,
                cv_Urls: 1,
                profession: 1,
                name: 1,
                ranking: 1,
                createdAt: 1,
                address: 1,
                packageType: 1,
                total_stories: {$size: "$stories"},
                total_questions: {$size: "$questions"},
                total_blogs: {$size: "$blogs"},
                total_Following: {$size: "$following"},
                total_Followers: {$size: "$followers"},
            }
        }
    ], function (err, data) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
         if (!data) {
             return callback("YOU NEED TO BE A REGISTERED USER TO VIEW GET ACCESS");
         }

        User.populate(data, {
                'path': 'categoryTags.categoryId',
                'select': 'title'
            },

            function (err, user) {

                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }

               return callback(null, user);
            });
    });
}

function answer(id, callback) {
    Answers.aggregate([
        {$match: {'answeredBy': id}},
        {
            $project: {
                // answers: {
                //     $map: {
                //         input: '$answers',
                //         as: "element",
                //         in: {
                //             answerId: "$$element._id",
                //             answeredOn: '$$element.createdAt',
                //             answeredBy: '$$element.answeredBy',
                //             answer: '$$element.answer',
                //             views: "$$element.views",
                //             upVotes: {$size: "$$element.likes"},
                //             downVotes: {$size: "$$element.dislikes"}
                //         }
                //     }
                // },
                answer: 1,
                createdAt: 1,
                postId: 1,
                view: 1,
                view_cost: 1,
                attachment: 1,
                answeredBy: 1,
                'total_likes': {$size: "$likes"},
                'total_dislikes': {$size: "$dislikes"}
            }
        },
        {$sort: {createdAt: -1}},
        {$limit: 50}
    ], function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        Answers.populate(data, {
                'path': 'answeredBy postId',
                'select': 'name profile_picture question'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }

                return callback(null, post);
            }
        );
    });
}

function blog(id, callback) {
    Blog.aggregate([
        {$match: {'postedBy': id}},
        {
            $project: {
                answers: {$size: "$answers"},
                comments: {$size: '$comments'},
                views: 1,
                "category.categoryId": 1,
                createdAt: 1,
                postedBy: 1,
                question: 1
            }
        },
        {$sort: {date: -1}},
    ], function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        Blog.populate(data, {
                'path': 'postedBy category.categoryId',
                'select': 'name photoUrl ranking title'
            },

            function (err, post) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }

                return callback(null, post);
            }
        );
    });
}

function story(id, callback) {
    Story.aggregate([
        {$match: {'postedBy': id}},
        {
            $project: {
                answers: {$size: "$answers"},
                comments: {$size: '$comments'},
                views: 1,
                "category.categoryId": 1,
                createdAt: 1,
                postedBy: 1,
                question: 1
            }
        },
        {$sort: {date: -1}},
    ], function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        Story.populate(data, {
                'path': 'postedBy category.categoryId',
                'select': 'name photoUrl  ranking title'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }

                return callback(null, post);
            }
        );
    });
}

function question(id, callback) {
    Question.aggregate([
        {$match: {'postedBy': id}},
        {
            $lookup: {
                from: "answers",
                localField: "_id",
                foreignField: "postId",
                as: "answers"
            }
        },
        {
            $project: {
                answers: {$size: "$answers"},
                comments: {$size: '$comments'},
                views: 1,
                "category.categoryId": 1,
                createdAt: 1,
                postedBy: 1,
                question: 1
            }
        },
        {$sort: {date: -1}},
    ], function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        Story.populate(data, {
                'path': 'postedBy category.categoryId',
                'select': 'name photoUrl  ranking title'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }

                return callback(null, post);
            }
        );
    });
}

function followers(id, callback) {
    User.findOne({_id: id})
        .populate({
            path: 'followers.userId',
            select: 'name ranking photoUrl'
        })
        .exec(function (err, result) {
            if(err){
                console.log(err);
                return callback("Something unexpected happened");
            }
            if(!result){
                return callback("no user found with details provided");
            }

            return callback(null, result.followers)
        })
}

function following(id, callback) {
    User.findOne({_id: id})
        .populate({
            path: 'following.userId',
            select: 'name ranking photoUrl'
        })
        .exec(function (err, result) {
            if(err){
                console.log(err);
                return callback("Something unexpected happened");
            }
            if(!result){
                return callback("no user found with details provided");
            }

            return callback(null, result.following)
        })
}

function upload(file, callback) {
    if (file.length > 1) {
        return res.badRequest('you can not upload more than 1 picture at a time')
    }
    cloudinary.v2.uploader.upload(file.path, {resource_type: 'auto'}, function (err, result) {
        if (err) {
            console.log('it failed here' + err);
            return callback(err);
        } else {
            console.log(result);
            let data = {
                public_id: result.public_id,
                mediaUrl: result.secure_url,
                mediaType: result.resource_type
            };

            return callback(null, data);
        }
    })
}

function chatCost(packId, amount, currency, callback) {
    Packages.findOne({_id: packId}, function (err, pack) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!pack || pack === undefined || pack === null) {
            return callback("no package found with that name");
        }
        console.log(pack)
        if (amount < 0 || amount > info.chat.max.amount) {
            return callback("cost to chat cannot be less than zero or greater than your package maximum allowed pricing of " + info.chat.max.amount);
        }
        if (currency !== info.chat.max.currency) {
            return callback('the currency must match that of your package');
        }

        return callback(null, pack)
    });
}

// /*** END POINT FOR GETTING PERSONAL PROFILE BY CURRENTLY LOGGED IN USER */
// router.get('/', function(req, res) {
//     let id = req.user.id;
//
//     ranking(id, function (err, user) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//         User.aggregate([
//             {$match: {'_id': user._id}},
//             {$project: {totalFollowing:{$size :"$following"},totalFollowers:{$size :"$followers"},email:1, categoryTags:1,
//                 phone_number:1, bio:1,photoUrl:1, public_id:1, profession:1, name:1, ranking:1,
//                 followers:1, following:1, createdAt: 1, address:1, updatedAt:1, packageType:1
//         }},
//         ], function (err, data) {
//             if (err) {
//                 console.log(err);
//                 return res.badRequest("Something unexpected happened");
//             }
//
//         User.populate(data,{
//                 'path': 'followers.userId following.userId categoryTags.categoryId',
//                 'select': 'name photoUrl email bio title'
//             },
//
//             function (err, user) {
//
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//                 if (!user) {
//                     return res.badRequest("YOU NEED TO BE A REGISTERED USER TO VIEW GET ACCESS");
//                 }
//
//                 res.success(user);
//             });
//         })
//     });
// });

// /*** END POINT FOR GETTING A USER PROFILE BY OTHER USERS */
// router.get('/:userId', function(req, res) {
//     let id = req.params.userId;
//
//     ranking(id, function (err, user) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//         console.log(user);
//         User.aggregate([
//             {$match: {'_id': id}},
//             {$unwind: {path: "$categoryTags", preserveNullAndEmptyArrays: true}},
//             {$project: {totalFollowing:{$size :"$following"},totalFollowers:{$size :"$followers"},email:1,
//                 phone_number:1, bio:1,photoUrl:1, public_id:1, profession:1, name:1, ranking:1,
//                 followers:1, following:1, createdAt: 1, address:1
//             }},
//         ], function (err, data) {
//             if (err) {
//                 console.log(err);
//                 return res.badRequest("Something unexpected happened");
//             }
//
//             User.populate(data, {
//                     'path': 'followers.userId following.userId rating.ratedBy',
//                     'select': 'name photoUrl email bio'
//                 },
//
//                 function (err, user) {
//
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//                     if (!user) {
//                         return res.badRequest("YOU NEED TO BE A REGISTERED USER TO VIEW PROFILE");
//                     }
//
//                     res.success(user);
//                 });
//         })
//     });
// });


// /*** END POINT FOR UPDATING PROFILE PHONE NUMBER OF CURRENTLY LOGGED IN USER */
// router.post('/phone_number', function(req, res){
//
//     let phone_number = req.body.phone_number,
//         validatedPhoneNumber = validator.isValidPhoneNumber(res, phone_number);
//
//     if (!validatedPhoneNumber)
//         return;
//
//     User.findOne({phone_number: phone_number}, function (err, user) {
//         if (err) {
//             console.log(err);
//             return res.serverError("Something unexpected happened");
//         }
//         if (user && user._id !== req.user.id){
//             return res.badRequest('A user already Exist with Phone Number: '+ phone_number);
//         }
//         if (user && user._id === req.user.id){
//             return res.badRequest('Phone number already used by You. select a new Phone number you will love to change to');
//         }
//
//         User.findByIdAndUpdate(req.user.id, {$set: {phone_number: phone_number}}, {new: true}, function(err, user) {
//             if (err) {
//                 console.log(err);
//                 return res.serverError("Something unexpected happened");
//             }
//             if (!user) {
//                 return res.badRequest("User profile not found please be sure you are still logged in");
//             }
//             User.populate(user, {
//                     'path': 'followers.userId following.userId categoryTags.categoryId',
//                     'select': 'name photoUrl bio title'
//                 }, function (err, user) {
//
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//                     let info = {
//                         profession: user.profession,
//                         photo: user.photoUrl,
//                         name: user.name,
//                         email: user.email,
//                         phone_number: user.phone_number,
//                         address: user.address,
//                         bio: user.bio,
//                         followers: user.followers,
//                         following: user.following,
//                         category: user.categoryTags
//                     };
//                     res.success(info);
//                 }
//             )
//         })
//     })
// });

// /*** END POINT FOR UPDATING PROFILE PHONE NUMBER OF CURRENTLY LOGGED IN USER */
// router.post('/category', function(req, res){
//
//     let category = req.body.category,
//         validated = validator.isCategory(res, category);
//     if (!validated) return;
//
//     //remove duplicates before proceeding
//     arrayUtils.removeDuplicates(category);
//
//     Category.find({_id: category}, function (err, cate) {
//         if (err && err.name === "CastError") {
//             return res.badRequest("category error please pick from the available categories");
//         }
//         if (err) {
//             return res.badRequest("something unexpected happened");
//         }
//
//         let data = {};
//         data.categoryTags = []; //new empty array
//
//         for (let i = 0; i < category.length; i++) {
//             let categoryId = category[i];
//
//             if (typeof(categoryId) !== "string") {
//                 return res.badRequest("User IDs in tagged array must be string");
//             }
//
//             data.categoryTags.push({categoryId: categoryId});
//         }
//
//         console.log(data)
//         User.findByIdAndUpdate(req.user.id, {$set: data}, {new: true}, function (err, user) {
//             if (err) {
//                 console.log(err);
//                 return res.serverError("Something unexpected happened");
//             }
//             if (!user) {
//                 return res.badRequest("User profile not found please be sure you are still logged in");
//             }
//
//             User.populate(user, {
//                     'path': 'followers.userId following.userId categoryTags.categoryId',
//                     'select': 'name photoUrl bio title'
//                 }, function (err, user) {
//
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//                     let info = {
//                         profession: user.profession,
//                         photo: user.photoUrl,
//                         name: user.name,
//                         email: user.email,
//                         phone_number: user.phone_number,
//                         address: user.address,
//                         bio: user.bio,
//                         followers: user.followers,
//                         following: user.following,
//                         category: user.categoryTags
//                     };
//
//                     res.success(info);
//                 }
//             )
//         })
//     })
// });

module.exports = router;