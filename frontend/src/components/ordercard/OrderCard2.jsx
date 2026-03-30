// OrderCard2.jsx
import React from "react";
import "./OrderCard2.scss";

function OrderCard2() {
  return (
    <thead className="ordercard2">
      <tr>
        <th>PO Date</th>
        <th>Name</th>
        <th>PO Number</th>
        <th>Part / Size</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Order Value</th>
        <th>Remaining Qty</th>
      </tr>
    </thead>
  );
}

export default OrderCard2;