import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    invoiceNumber: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number },
    exchangeRate: { type: Number, default: 0 },
    itemType: {
      type: String,
      enum: ["Domestic", "Export"],
      default: "Domestic",
    },
    currency: { type: String, enum: ["INR", "USD"], default: "INR" },
    purchaseOrderNumber: { type: String },
    invoiceDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Invoice", invoiceSchema);
