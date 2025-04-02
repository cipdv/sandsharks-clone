import mongoose, { Schema } from 'mongoose';

const memberSchema = new Schema({
    id: {type: String},
    firstName: {type: String, required: [true, 'no first name']},
    lastName: {type: String, required: [true, 'no last name']},
    preferredName: {type: String},
    pronouns: {type: String},
    memberType: {type: String},
    // member types: pending, member, supershark, ultrashark
    email: {type: String, required: [true, 'no email']},
    phoneNumber: {type: String},
    about: {type: String},
    profilePic: {
        image: String,
        approved: Boolean
    },
    waiver: {type: Boolean},
    emailNotifications: {type: Boolean},
    password: {type: String, required: [true, 'no password']},
    createdAt: {type: Date, default: Date.now},
})

let Member;

try {
  Member = mongoose.model("Member");
} catch {
  Member = mongoose.model("Member", memberSchema);
}

export default Member;