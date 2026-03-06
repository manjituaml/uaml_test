import PurchaseOrder from "../model/purchaseOrder.model.js";
import User from "../model/userModel.js"

export const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      itemName,
      itemNumber,
      itemType = "Domestic",
      quantity,
      unitPrice,
      plannedDispatchDate,
      action,
      exchangeRate,
    } = req.body;

    // Validate required fields
    const errors = [];

    if (!customerName?.trim()) {
      errors.push("Customer name is required");
    }

    if (!itemName?.trim()) {
      errors.push("Item name is required");
    }

    if (!itemNumber?.trim()) {
      errors.push("Item number is required");
    }

    if (!quantity || quantity <= 0) {
      errors.push("Valid quantity is required (greater than 0)");
    }

    if (!unitPrice || unitPrice <= 0) {
      errors.push("Valid unit price is required (greater than 0)");
    }

    // Validate exchange rate for Export orders
    if (itemType === "Export") {
      if (!exchangeRate || exchangeRate <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid exchange rate is required for Export orders",
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Validate itemType
    if (itemType && !["Domestic", "Export"].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item type. Must be 'Domestic' or 'Export'",
      });
    }

    // Check if item number already exists
    const existingOrder = await PurchaseOrder.findOne({
      itemNumber: itemNumber.trim(),
    });
    
    // if (existingOrder) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Item number already exists",
    //     existingItem: existingOrder.itemName,
    //   });
    // }

    // Calculate financial values
    const totalAmount = quantity * unitPrice;
    const currency = itemType === "Export" ? "USD" : "INR";
    const calculatedExchangeRate = itemType === "Export" ? (exchangeRate || 0) : 0;
    
    // Calculate total amount in INR for reporting
    const totalAmountInINR = itemType === "Export" 
      ? totalAmount * calculatedExchangeRate 
      : totalAmount;

    // Create new order
    const newOrder = new PurchaseOrder({
      customerName: customerName.trim(),
      itemName: itemName.trim(),
      itemNumber: itemNumber.trim(),
      itemType,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      exchangeRate: calculatedExchangeRate,
      totalAmount,
      reflectAmount: totalAmount, // Initially, reflectAmount equals totalAmount (no dispatches yet)
      currency,
      action: action || "pending",
      dispatchedQuantity: 0,
      dispatches: [],
      plannedDispatchDate: plannedDispatchDate
        ? new Date(plannedDispatchDate)
        : null,
      closedItem: null,
    });

    // Save to database
    const savedOrder = await newOrder.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      order: {
        id: savedOrder._id,
        customerName: savedOrder.customerName,
        itemName: savedOrder.itemName,
        itemNumber: savedOrder.itemNumber,
        itemType: savedOrder.itemType,
        quantity: savedOrder.quantity,
        unitPrice: savedOrder.unitPrice,
        exchangeRate: savedOrder.exchangeRate,
        currency: savedOrder.currency,
        totalAmount: savedOrder.totalAmount,
        reflectAmount: savedOrder.reflectAmount,
        plannedDispatchDate: savedOrder.plannedDispatchDate,
        action: savedOrder.action,
        createdAt: savedOrder.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating purchase order:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry. Item number must be unique.",
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Server error while creating order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      itemType = "",
      currency = "",
    } = req.query;

    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { itemName: { $regex: search, $options: "i" } },
        { itemNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by item type
    if (itemType) {
      query.itemType = itemType;
    }

    // Filter by currency
    if (currency) {
      query.currency = currency;
    }

    // Filter by status
    if (status === "open") {
      query.closedItem = null;
    } else if (status === "closed") {
      query.closedItem = { $ne: null };
    } else if (status === "partial") {
      // Partially dispatched (some dispatched but not all)
      query.$expr = {
        $and: [
          { $gt: ["$dispatchedQuantity", 0] },
          { $lt: ["$dispatchedQuantity", "$quantity"] }
        ]
      };
    }

    const skip = (page - 1) * limit;

    const orders = await PurchaseOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      // .limit(parseInt(limit));

    // Enhance orders with calculated fields
    const enhancedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const dispatchedQuantity = order.dispatchedQuantity || 0;
      const remainingQuantity = order.quantity - dispatchedQuantity;
      const dispatchedValue = dispatchedQuantity * order.unitPrice;
      const remainingValue = remainingQuantity * order.unitPrice;
      
      return {
        ...orderObj,
        remainingQuantity,
        dispatchedValue,
        remainingValue,
        completionPercentage: order.quantity > 0 
          ? ((dispatchedQuantity / order.quantity) * 100).toFixed(2)
          : 0,
        // reflectAmount should equal remaining value
        reflectAmount: remainingValue
      };
    });

    const total = await PurchaseOrder.countDocuments(query);

    // Get summary statistics
    const summary = await PurchaseOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalDispatchedQuantity: { $sum: "$dispatchedQuantity" },
          totalOrderValue: { $sum: "$totalAmount" },
          totalReflectAmount: { $sum: "$reflectAmount" },
          totalOrdersOpen: {
            $sum: { $cond: [{ $eq: ["$closedItem", null] }, 1, 0] }
          },
          totalOrdersClosed: {
            $sum: { $cond: [{ $ne: ["$closedItem", null] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      summary: summary[0] || {
        totalOrders: 0,
        totalQuantity: 0,
        totalDispatchedQuantity: 0,
        totalOrderValue: 0,
        totalReflectAmount: 0,
        totalOrdersOpen: 0,
        totalOrdersClosed: 0
      },
      orders: enhancedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await PurchaseOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Calculate detailed information
    const totalAmount = order.quantity * order.unitPrice;
    const dispatchedQuantity = order.dispatchedQuantity || 0;
    const remainingQuantity = order.quantity - dispatchedQuantity;
    const isComplete = dispatchedQuantity >= order.quantity;
    const isPartial = dispatchedQuantity > 0 && !isComplete;
    
    // Calculate financial metrics
    const dispatchedValue = dispatchedQuantity * order.unitPrice;
    const remainingValue = remainingQuantity * order.unitPrice;
    
    // Calculate INR values for export orders
    const totalAmountInINR = order.itemType === "Export" 
      ? totalAmount * (order.exchangeRate || 1)
      : totalAmount;
    const dispatchedValueInINR = order.itemType === "Export"
      ? dispatchedValue * (order.exchangeRate || 1)
      : dispatchedValue;
    const remainingValueInINR = order.itemType === "Export"
      ? remainingValue * (order.exchangeRate || 1)
      : remainingValue;

    // Enhance dispatches with financial data
    const dispatchesWithValue = order.dispatches.map(dispatch => {
      const dispatchValue = dispatch.quantity * order.unitPrice;
      const dispatchValueInINR = order.itemType === "Export"
        ? dispatchValue * (order.exchangeRate || 1)
        : dispatchValue;
      
      return {
        ...dispatch.toObject(),
        unitPrice: order.unitPrice,
        dispatchValue,
        dispatchValueInINR,
        currency: order.currency
      };
    });

    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        totalAmount,
        dispatchedValue,
        remainingValue,
        reflectAmount: remainingValue, // reflectAmount = remaining value
        totalAmountInINR,
        dispatchedValueInINR,
        remainingValueInINR,
        remainingQuantity,
        isComplete,
        isPartial,
        completionPercentage: ((dispatchedQuantity / order.quantity) * 100).toFixed(2),
        dispatches: dispatchesWithValue
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update order
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      itemName,
      itemNumber,
      itemType,
      quantity,
      unitPrice,
      exchangeRate,
      plannedDispatchDate,
      action,
    } = req.body;

    // Find the order
    const order = await PurchaseOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order is closed
    if (order.closedItem) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit a closed order",
      });
    }

    // Validate action if provided
    if (
      action &&
      !["pending", "ready", "invoice ready", "dispatch"].includes(action)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid action. Must be 'pending', 'ready', 'invoice ready', or 'dispatch'",
      });
    }

    // Validate exchange rate for Export orders
    if (itemType === "Export" && exchangeRate !== undefined) {
      if (exchangeRate <= 0) {
        return res.status(400).json({
          success: false,
          message: "Exchange rate must be greater than 0 for Export orders",
        });
      }
    }

    // Validate that quantity isn't reduced below dispatched quantity
    if (quantity && quantity < order.dispatchedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot set quantity below already dispatched amount (${order.dispatchedQuantity} units already dispatched)`,
      });
    }

    // Check if item number is being changed and validate uniqueness
    if (itemNumber && itemNumber !== order.itemNumber) {
      // Check if dispatch has already started
      if (order.dispatchedQuantity > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot change item number after dispatch has started",
        });
      }

      // Check if new item number already exists
      const existingOrder = await PurchaseOrder.findOne({
        itemNumber: itemNumber.trim(),
        _id: { $ne: id },
      });

      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: "Item number already exists",
        });
      }
    }

    // Prepare update data
    const updateData = {};

    if (customerName) updateData.customerName = customerName.trim();
    if (itemName) updateData.itemName = itemName.trim();
    if (itemNumber && order.dispatchedQuantity === 0) {
      updateData.itemNumber = itemNumber.trim();
    }
    if (itemType) updateData.itemType = itemType;
    if (action) updateData.action = action;

    // Update financial fields
    const newQuantity = quantity !== undefined ? Number(quantity) : order.quantity;
    const newUnitPrice = unitPrice !== undefined ? Number(unitPrice) : order.unitPrice;
    const newExchangeRate = exchangeRate !== undefined ? Number(exchangeRate) : order.exchangeRate;
    const newItemType = itemType || order.itemType;

    // Recalculate total amount
    const newTotalAmount = newQuantity * newUnitPrice;
    updateData.totalAmount = newTotalAmount;

    // Update currency based on item type
    updateData.currency = newItemType === "Export" ? "USD" : "INR";
    
    // Update exchange rate
    if (exchangeRate !== undefined || itemType) {
      updateData.exchangeRate = newItemType === "Export" ? newExchangeRate : 0;
    }

    // Recalculate reflect amount (remaining value)
    const remainingQuantity = newQuantity - order.dispatchedQuantity;
    updateData.reflectAmount = remainingQuantity * newUnitPrice;

    if (plannedDispatchDate !== undefined) {
      updateData.plannedDispatchDate = plannedDispatchDate
        ? new Date(plannedDispatchDate)
        : null;
    }

    // Update the order
    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update order dispatch
export const updateDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { dispatchQuantity, dispatchDate, invoiceNumber, notes } = req.body;

    if (!dispatchQuantity || dispatchQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid dispatch quantity is required",
      });
    }

    const order = await PurchaseOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order is already closed
    if (order.closedItem) {
      return res.status(400).json({
        success: false,
        message: "Cannot update a closed order",
      });
    }

    // Calculate current total dispatched
    const currentDispatched = order.dispatches.reduce(
      (total, d) => total + d.quantity,
      0,
    );
    const remaining = order.quantity - currentDispatched;

    // Check if dispatch exceeds total quantity
    if (dispatchQuantity > remaining) {
      return res.status(400).json({
        success: false,
        message: `Dispatch quantity exceeds remaining quantity. Remaining: ${remaining}`,
      });
    }

    // Create new dispatch entry
    const newDispatch = {
      quantity: Number(dispatchQuantity),
      date: dispatchDate ? new Date(dispatchDate) : new Date(),
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      notes: notes || "",
    };

    // Add to dispatches array
    order.dispatches.push(newDispatch);

    // Calculate new total dispatched
    const newTotalDispatched = currentDispatched + Number(dispatchQuantity);
    
    // Update reflectAmount (remaining value)
    const remainingQuantity = order.quantity - newTotalDispatched;
    order.reflectAmount = remainingQuantity * order.unitPrice;

    // Check if order is complete
    if (newTotalDispatched >= order.quantity) {
      order.closedItem = new Date();
      order.action = "dispatch";
      order.reflectAmount = 0; // No remaining value when complete
    }

    const updatedOrder = await order.save();

    // Calculate values for response
    const totalDispatchedNow = updatedOrder.dispatches.reduce(
      (total, d) => total + d.quantity,
      0,
    );
    const remainingNow = order.quantity - totalDispatchedNow;
    const dispatchValue = dispatchQuantity * order.unitPrice;
    const remainingValue = remainingNow * order.unitPrice;

    res.status(200).json({
      success: true,
      message: `Dispatched ${dispatchQuantity} units successfully`,
      order: updatedOrder,
      dispatchDetails: {
        dispatchValue,
        dispatchCurrency: order.currency,
        exchangeRate: order.exchangeRate
      },
      remaining: remainingNow,
      remainingValue,
      reflectAmount: remainingValue,
      isComplete: updatedOrder.closedItem !== null,
      newDispatch: {
        ...newDispatch,
        dispatchValue
      },
    });
  } catch (error) {
    console.error("Error updating dispatch:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get dispatch history with details
export const getDispatchHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await PurchaseOrder.findById(id).select(
      "dispatches quantity itemName itemNumber unitPrice currency exchangeRate itemType reflectAmount",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Calculate dispatch values
    const dispatchesWithValue = order.dispatches.map(dispatch => {
      const dispatchValue = dispatch.quantity * order.unitPrice;
      const dispatchValueInINR = order.itemType === "Export"
        ? dispatchValue * (order.exchangeRate || 1)
        : dispatchValue;

      return {
        ...dispatch.toObject(),
        unitPrice: order.unitPrice,
        dispatchValue,
        dispatchValueInINR,
        currency: order.currency
      };
    });

    const totalDispatched = order.dispatches.reduce(
      (total, d) => total + d.quantity,
      0,
    );
    const remainingQuantity = order.quantity - totalDispatched;
    const totalDispatchedValue = totalDispatched * order.unitPrice;
    const remainingValue = remainingQuantity * order.unitPrice;

    res.status(200).json({
      success: true,
      orderId: id,
      itemName: order.itemName,
      itemNumber: order.itemNumber,
      totalQuantity: order.quantity,
      unitPrice: order.unitPrice,
      currency: order.currency,
      exchangeRate: order.exchangeRate,
      totalDispatched,
      remainingQuantity,
      totalDispatchedValue,
      remainingValue,
      reflectAmount: remainingValue, // reflectAmount should equal remaining value
      dispatches: dispatchesWithValue.sort((a, b) => b.date - a.date), // Latest first
    });
  } catch (error) {
    console.error("Error fetching dispatch history:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get financial summary
export const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate, itemType, currency } = req.query;

    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }
    
    if (itemType) matchStage.itemType = itemType;
    if (currency) matchStage.currency = currency;

    const summary = await PurchaseOrder.aggregate([
      { $match: matchStage },
      {
        $facet: {
          overallStats: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalQuantity: { $sum: "$quantity" },
                totalDispatchedQuantity: { $sum: "$dispatchedQuantity" },
                totalOrderValue: { $sum: "$totalAmount" },
                totalReflectAmount: { $sum: "$reflectAmount" },
                totalDispatchedValue: { 
                  $sum: { 
                    $multiply: ["$dispatchedQuantity", "$unitPrice"] 
                  }
                },
                openOrders: {
                  $sum: { $cond: [{ $eq: ["$closedItem", null] }, 1, 0] }
                },
                closedOrders: {
                  $sum: { $cond: [{ $ne: ["$closedItem", null] }, 1, 0] }
                },
                partialOrders: {
                  $sum: { 
                    $cond: [
                      { 
                        $and: [
                          { $gt: ["$dispatchedQuantity", 0] },
                          { $lt: ["$dispatchedQuantity", "$quantity"] }
                        ]
                      }, 
                      1, 
                      0
                    ]
                  }
                }
              }
            }
          ],
          byItemType: [
            {
              $group: {
                _id: "$itemType",
                count: { $sum: 1 },
                totalValue: { $sum: "$totalAmount" },
                totalReflectAmount: { $sum: "$reflectAmount" }
              }
            }
          ],
          byCurrency: [
            {
              $group: {
                _id: "$currency",
                count: { $sum: 1 },
                totalValue: { $sum: "$totalAmount" }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      summary: summary[0]
    });

  } catch (error) {
    console.error("Error generating financial summary:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Close order manually
export const closeOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await PurchaseOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.closedItem) {
      return res.status(400).json({
        success: false,
        message: "Order is already closed",
      });
    }

    // Check if all items are dispatched
    if (order.dispatchedQuantity < order.quantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot close order. Only ${order.dispatchedQuantity} of ${order.quantity} units dispatched`,
      });
    }

    order.closedItem = new Date();
    order.action = "dispatch";
    order.reflectAmount = 0; // No remaining value when closed
    
    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: "Order closed successfully",
      order: updatedOrder,
      summary: {
        totalOrderValue: order.totalAmount,
        totalDispatchedValue: order.dispatchedQuantity * order.unitPrice,
        reflectAmount: 0,
        currency: order.currency,
        closedDate: order.closedItem
      }
    });
  } catch (error) {
    console.error("Error closing order:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId =  req.user;
    const user = await User.findById(adminId);

    if(!user) return res.status(404).json({success: false, message: 'User not found'});
    if(!user?.isAdmin) return res.status(404).json({success: false, message: 'Only Admin can delete orders'});

    const order = await PurchaseOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Prevent deletion if dispatch has started
    if (order.dispatchedQuantity > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete order after dispatch has started",
      });
    }

    const deletedOrder = await PurchaseOrder.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Bulk update dispatch status
export const bulkUpdateDispatchStatus = async (req, res) => {
  try {
    const { orderIds, action } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order IDs array is required",
      });
    }

    if (!action || !["pending", "ready", "invoice ready", "dispatch"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid action is required",
      });
    }

    const result = await PurchaseOrder.updateMany(
      { _id: { $in: orderIds }, closedItem: null },
      { $set: { action } }
    );

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} orders successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};