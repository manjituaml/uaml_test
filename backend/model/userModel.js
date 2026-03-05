import mongoose from "mongoose";

const uamlUserSchema = new mongoose.Schema({
    userName: {type: String, required: true},
    userId: {type: String, unique: true},
    userEmail: {type: String, required: true},
    password: {type:String, required: true},
    department: {type: String, enum: ['production', 'marketing', 'purchase', 'sales', 'account', 'hiring', 'quality', 'store']},
    jobPosition: {type: String, enum: ['ceo', 'manager', 'junior', 'senior']},
    isStatus: {type: String, enum: ['active', 'suspend', 'deactive']},
    isAdmin: {type: Boolean, default: false},
    isHead: {type: Boolean, default: false},
    statusPeriode: {type:Date}
}, {timestamps: true})

export default mongoose.model("User", uamlUserSchema);