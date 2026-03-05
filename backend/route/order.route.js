// routes/purchaseOrder.routes.js
import express from "express";
import { closeOrder, createOrder, deleteOrder, getAllOrders, getOrderById, updateDispatch, updateOrder } from "../controller/order.controller.js";
import { isAuthentication } from "../middleware/isAuthentication.js";


const router = express.Router();

// Create a new purchase order
router.post("/",isAuthentication, createOrder);

// Get all orders with filters
router.get("/",isAuthentication, getAllOrders);

// Get single order
router.get("/:id",isAuthentication, getOrderById); 

router.put("/:id",isAuthentication, updateOrder); 
// Update dispatch
router.put("/:id/dispatch",isAuthentication, updateDispatch);

// Close order
router.put("/:id/close",isAuthentication, closeOrder);

// Delete order
router.delete("/:id",isAuthentication, deleteOrder);

export default router;