import mongoose from "mongoose";

const uamlNotificationSchema = new mongoose.Schema({
  notification: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
  readBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  
}, { timestamps: true });

export default mongoose.model("Notification", uamlNotificationSchema);
