import mongoose from "mongoose";

const dispatchSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  invoiceNumber: { type: String },
  notes: { type: String }
}, { _id: true });

const purchaseItemSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  itemName: { type: String, required: true },
  itemNumber: { type: String, required: true },
  itemType: { type: String, enum: ['Domestic', 'Export'], default: 'Domestic' },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  exchangeRate: {type: Number, default: 0},
  totalAmount: {type: Number},
  reflectAmount: {type: Number}, // agar total order 10 h and 4 order dispatch ho gye toh amount hogi 6 * unit price 
  currency: {type: String, enum: ["INR", "USD"], default: "INR"},
  action: { type: String, enum: ['pending', 'ready', 'invoice ready', 'dispatch'], default: 'pending' },
  file: { type: String, default: '' },
  plannedDispatchDate: { type: Date },
  dispatches: [dispatchSchema],
  dispatchedQuantity: { type: Number, default: 0 },
  closedItem: { type: Date },
}, { timestamps: true });

purchaseItemSchema.pre("save", function () {
  if (this.dispatches?.length > 0) {
    this.dispatchedQuantity = this.dispatches.reduce(
      (total, dispatch) => total + (dispatch.quantity || 0),
      0
    );
  } else {
    this.dispatchedQuantity = 0;
  }
});

export default mongoose.model("PurchaseOrder", purchaseItemSchema);
