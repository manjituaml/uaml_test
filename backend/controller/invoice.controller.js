import Invoice from "../model/invoice.model.js";

export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceDate,
      order,
      exchangeRate,
      currency,
      invoiceNumber,
      quantity,
      unitPrice,
      itemType,
      purchaseOrderNumber,
    } = req.body;

    if (!invoiceNumber)
      return res
        .status(400)
        .json({ success: false, message: "Invoice Number is required" });

    if (!quantity || quantity <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Valid quantity is required" });

    if (!unitPrice || unitPrice <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Valid unit price is required" });

    if (!itemType || !["Domestic", "Export"].includes(itemType))
      return res.status(400).json({
        success: false,
        message: "Invalid itemType. Must be Domestic or Export",
      });

    const totalAmount = quantity * unitPrice;
    let totalAmountInINR = totalAmount;

    if (itemType === "Export") {
      if (!exchangeRate || exchangeRate <= 0)
        return res.status(400).json({
          success: false,
          message: "Exchange rate required for export invoice",
        });
      totalAmountInINR = totalAmount * exchangeRate;
    }

    const invoice = await Invoice.create({
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      order,
      invoiceNumber,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      exchangeRate: itemType === "Export" ? exchangeRate : 0,
      currency: itemType === "Export" ? "USD" : "INR",
      itemType,
      purchaseOrderNumber,
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice,
      financials: {
        totalAmount,
        totalAmountInINR,
        currency: invoice.currency,
      },
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating invoice",
      error: error.message,
    });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Fetch invoices error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching invoices",
    });
  }
};

export const invoices = async (req, res) => {
  try {
    const { fromDate, tillDate } = req.params;

    if (!fromDate || !tillDate) {
      return res.status(400).json({
        success: false,
        message: "fromDate and tillDate are required",
      });
    }

    const invoices = await Invoice.find({
      invoiceDate: {
        $gte: new Date(fromDate),
        $lte: new Date(tillDate),
      },
    }).sort({ invoiceDate: -1 });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Fetch invoices by date error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching invoices",
    });
  }
};

export const currentMonthInvoices = async (req, res) => {
  try {
    const now = new Date();

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const invoices = await Invoice.find({
      invoiceDate: {
        $gte: firstDay,
        $lte: lastDay,
      },
    }).sort({ invoiceDate: -1 });

    return res.status(200).json({
      success: true,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Fetch current month invoices error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching current month invoices",
    });
  }
};
