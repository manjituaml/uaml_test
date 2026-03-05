import PurchaseOrder from "../model/purchaseOrder.model.js";

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

    const currency = itemType === "Export" ? "USD" : "INR";
    if (itemType === "Export" && (!exchangeRate || exchangeRate <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Valid exchange rate required for Export orders",
      });
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
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "Item number already exists",
        existingItem: existingOrder.itemName,
      });
    }

    // Calculate total amount
    const totalAmount = quantity * unitPrice;

    // Create new order
    const newOrder = new PurchaseOrder({
      customerName: customerName.trim(),
      itemName: itemName.trim(),
      itemNumber: itemNumber.trim(),
      itemType,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      action: action || "pending",
      dispatchedQuantity: 0, // Initialize as 0
      dispatchDates: [], // Initialize empty array
      plannedDispatchDate: plannedDispatchDate
        ? new Date(plannedDispatchDate)
        : null,
      closedItem: null, // Initialize as null
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
        totalAmount: totalAmount,
        plannedDispatchDate: savedOrder.plannedDispatchDate,
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

    // Filter by status
    if (status === "open") {
      query.closedItem = null;
    } else if (status === "closed") {
      query.closedItem = { $ne: null };
    }

    const skip = (page - 1) * limit;

    const orders = await PurchaseOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PurchaseOrder.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      orders,
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

    // Calculate additional details
    const remainingQuantity = order.quantity - order.dispatchedQuantity;
    const isComplete = order.dispatchedQuantity >= order.quantity;

    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        remainingQuantity,
        isComplete,
        totalAmount: order.quantity * order.unitPrice,
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

// Add this to your order.controller.js
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
      plannedDispatchDate,
      action, // ADD THIS - action from request body
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

    // Validate that quantity isn't reduced below dispatched quantity
    if (quantity && quantity < order.dispatchedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot set quantity below dispatched amount (${order.dispatchedQuantity} units already dispatched)`,
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

    // Update fields
    const updateData = {};

    if (customerName) updateData.customerName = customerName.trim();
    if (itemName) updateData.itemName = itemName.trim();
    if (itemNumber && order.dispatchedQuantity === 0) {
      updateData.itemNumber = itemNumber.trim();
    }
    if (itemType) updateData.itemType = itemType;
    if (quantity) updateData.quantity = Number(quantity);
    if (unitPrice) updateData.unitPrice = Number(unitPrice);
    if (action) updateData.action = action; // ADD THIS - update action

    if (plannedDispatchDate !== undefined) {
      updateData.plannedDispatchDate = plannedDispatchDate
        ? new Date(plannedDispatchDate)
        : null;
    }

    // If quantity is being reduced, check if order should remain closed
    if (quantity && quantity === order.dispatchedQuantity && order.closedItem) {
      updateData.closedItem = order.closedItem; // Keep closed
    } else if (
      quantity &&
      quantity > order.dispatchedQuantity &&
      order.closedItem
    ) {
      updateData.closedItem = null; // Re-open if quantity increased above dispatched
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
// export const updateDispatch = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { dispatchQuantity, dispatchDate } = req.body;

//     if (!dispatchQuantity || dispatchQuantity <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid dispatch quantity is required",
//       });
//     }

//     const order = await PurchaseOrder.findById(id);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     // Check if order is already closed
//     if (order.closedItem) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot update a closed order",
//       });
//     }

//     // Calculate new dispatched quantity
//     const newDispatchedQuantity =
//       order.dispatchedQuantity + Number(dispatchQuantity);

//     // Check if dispatch exceeds total quantity
//     if (newDispatchedQuantity > order.quantity) {
//       return res.status(400).json({
//         success: false,
//         message: `Dispatch quantity exceeds remaining quantity. Remaining: ${order.quantity - order.dispatchedQuantity}`,
//       });
//     }

//     // Update order
//     order.dispatchedQuantity = newDispatchedQuantity;
//     order.dispatchDates.push(
//       dispatchDate ? new Date(dispatchDate) : new Date(),
//     );

//     // Check if order is complete
//     if (newDispatchedQuantity >= order.quantity) {
//       order.closedItem = new Date();
//     }

//     const updatedOrder = await order.save();

//     res.status(200).json({
//       success: true,
//       message: `Dispatched ${dispatchQuantity} units successfully`,
//       order: updatedOrder,
//       remaining: order.quantity - updatedOrder.dispatchedQuantity,
//       isComplete: updatedOrder.closedItem !== null,
//     });
//   } catch (error) {
//     console.error("Error updating dispatch:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

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

    // dispatchedQuantity will be auto-updated by pre-save middleware

    // Check if order is complete
    const newTotalDispatched = currentDispatched + Number(dispatchQuantity);
    if (newTotalDispatched >= order.quantity) {
      order.closedItem = new Date();
      order.action = "dispatch";
    }

    const updatedOrder = await order.save();

    // Calculate remaining for response
    const totalDispatchedNow = updatedOrder.dispatches.reduce(
      (total, d) => total + d.quantity,
      0,
    );
    const remainingNow = order.quantity - totalDispatchedNow;

    res.status(200).json({
      success: true,
      message: `Dispatched ${dispatchQuantity} units successfully`,
      order: updatedOrder,
      remaining: remainingNow,
      isComplete: updatedOrder.closedItem !== null,
      newDispatch: newDispatch,
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
      "dispatches quantity itemName itemNumber",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      orderId: id,
      itemName: order.itemName,
      itemNumber: order.itemNumber,
      totalQuantity: order.quantity,
      totalDispatched: order.dispatches.reduce(
        (total, d) => total + d.quantity,
        0,
      ),
      dispatches: order.dispatches.sort((a, b) => b.date - a.date), // Latest first
    });
  } catch (error) {
    console.error("Error fetching dispatch history:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
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

    order.closedItem = new Date();
    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: "Order closed successfully",
      order: updatedOrder,
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

    const deletedOrder = await PurchaseOrder.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

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
