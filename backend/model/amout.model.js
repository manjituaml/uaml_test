import mongoose from "mongoose";

const amountSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },

    orderType: {
      type: String,
      enum: ["Domestic", "Export"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unitPrice: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      enum: ["INR", "USD"],
      required: true,
      default: "INR"
    },

    exchangeRate: {
      type: Number,
      default: 0, // only for Export
    },

    totalAmount: {
      type: Number,
    },

    totalAmountInINR: {
      type: Number,
    },
  },
  { timestamps: true }
);



// 🔥 Auto calculation before saving
amountSchema.pre("save", function () {
  this.totalAmount = this.quantity * this.unitPrice;

  if (this.orderType === "Domestic") {
    this.currency = "INR";
    this.exchangeRate = 0;
    this.totalAmountInINR = this.totalAmount;
  }

  if (this.orderType === "Export") {
    this.currency = "USD";
    if (!this.exchangeRate) {
      throw new Error("Exchange rate required for Export orders");
    }
    this.totalAmountInINR = this.totalAmount * this.exchangeRate;
  }
});

export default mongoose.model("Amount", amountSchema);
