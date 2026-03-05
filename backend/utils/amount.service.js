import Amount from "../model/amout.model.js"

/**
 * ✅ Create Amount when Order is created
 */
export const addAmount = async (order) => {
  const exchangeRate =
    order.itemType === "Export" ? order.exchangeRate || 0 : 0;

  const amount = new Amount({
    order: order._id,
    orderType: order.itemType,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    exchangeRate,
  });

  await amount.save();
};

/**
 * ✅ Update Amount when Order is updated
 */
export const updateAmount = async (order) => {
  const amount = await Amount.findOne({ order: order._id });

  if (!amount) return;

  amount.orderType = order.itemType;
  amount.quantity = order.quantity;
  amount.unitPrice = order.unitPrice;

  if (order.itemType === "Export") {
    if (!amount.exchangeRate) {
      throw new Error("Exchange rate required for Export order");
    }
  } else {
    amount.exchangeRate = 0;
  }

  await amount.save();
};

/**
 * ✅ Delete Amount when Order is deleted
 */
export const deleteAmount = async (orderId) => {
  await Amount.findOneAndDelete({ order: orderId });
};
