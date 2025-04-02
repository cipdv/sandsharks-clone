
const postRepliesSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    // image: {
    //     type: String
    // }
})

// const begClinicRepliesSchema = mongoose.Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     email: {
//         type: String,
//         required: true
//     },
//     userId: {
//         type: String,
//         required: true
//     },
//     reply: {
//         type: String,
//         required: true
//     },
//     image: {
//         type: String
//     }
// })

// const beginnerClinicSchema = mongoose.Schema({
//     beginnerClinicOffered: {
//         type: Boolean,
//         default: false
//     },
//     beginnerClinicStartTime: {
//         type: String
//     },
//     beginnerClinicEndTime: {
//         type: String
//     },
//     replies: [begClinicRepliesSchema]
// })

import mongoose, { Schema } from 'mongoose';


const beginnerClinicSchema = new Schema({
    beginnerClinicOffered: {
        type: Boolean,
        default: false
    },
    beginnerClinicStartTime: {
        type: String
    },
    beginnerClinicEndTime: {
        type: String
    },
    
})

const postSchema = new Schema({
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            required: true
        },
        date: {
            type: String,
        },
        startTime: {
            type: String
        },
        endTime: {
            type: String
        },
        beginnerClinic: beginnerClinicSchema,
        replies: [postRepliesSchema]
    }, {
        timestamps: true
})

let Post;

try {
  Post = mongoose.model("Post");
} catch {
  Post = mongoose.model("Post", postSchema);
}

export default Post;