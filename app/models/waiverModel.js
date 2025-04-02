import mongoose, { Schema } from 'mongoose';

const waiverSchema = new Schema({
    id: {type: String},
    firstName: {type: String, required: [true, 'no first name']},
    lastName: {type: String, required: [true, 'no last name']},
    email: {type: String, required: [true, 'no email']},
    memberId: {type: String},
    createdAt: {type: Date, default: Date.now},
})

let Waiver;

try {
  Waiver = mongoose.model("Waiver");
} catch {
  Waiver = mongoose.model("Waiver", waiverSchema);
}

export default Waiver;