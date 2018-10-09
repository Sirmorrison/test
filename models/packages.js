let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let fields = {
    postedBy: {
        type: mongoose.Schema.Types.String,
        ref: 'Admin_user',
        required: true
    },
    plan: {
        type: String,
        required: true,
    },
    subscription: {
        currency: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        duration: {
            type: String,
            required: true
        },
    },
    stories: {
        min: {
            currency: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            }
        },
        max: {
            currency: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            }
        },
        commission:{
            user: {
                type: Number,
                required: true
            },
            admin: {
                type: Number,
                required: true
            }
        },
    },
    answers: {
        min: {
            currency: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            }
        },
        max: {
            currency: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            }
        },
        commission:{
            user: {
                question: {
                    type: Number,
                    required: true
                },
                answer: {
                    type: Number,
                    required: true
                }
            },
            admin: {
                type: Number,
                required: true
            }
        }
    },
    chat: {
        min: {
            currency: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            }
        },
        max: {
            currency: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            }
        },
        commission:{
            user: {
                type: Number,
                required: true
            },
            admin: {
                type: Number,
                required: true
            }
        }
    }
};

let Packages = new Schema(fields, {timestamps: true});
// Packages.index({plan: 1});
module.exports = mongoose.model('Packages', Packages);