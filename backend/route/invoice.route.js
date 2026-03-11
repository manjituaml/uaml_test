import express from "express";
import { createInvoice, currentMonthInvoices, getAllInvoices, invoices } from "../controller/invoice.controller.js";
import { isAuthentication } from "../middleware/isAuthentication.js";


const router = express.Router();

router.post("/create", isAuthentication, createInvoice)

router.get("/all",isAuthentication, getAllInvoices);

router.get("/range/:fromDate/:tillDate",isAuthentication, invoices);

router.get("/current-month",isAuthentication, currentMonthInvoices);

export default router;
