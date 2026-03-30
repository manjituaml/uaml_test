// OrderRow.jsx
import React from "react";

function OrderRow({ item, onClick }) {
  const amount = item.quantity * item.unitPrice;
  const remaining = item.quantity - (item.dispatchedQuantity || 0);

  return (
    <tr onClick={onClick} style={{ cursor: "pointer" }}>
      <td>{item.podate ? new Date(item.podate).toLocaleDateString() : "-"}</td>
      <td>{item.customerName}</td>
      <td>{item.itemNumber}</td>
      <td>{item.itemName}</td>
      <td>{item.quantity}</td>
      <td>
        {item.itemType === "Domestic" ? "₹" : "$"} {item.unitPrice}
      </td>
      <td>
        {item.itemType === "Domestic" ? "₹" : "$"} {amount}
      </td>
      <td>{remaining}</td>
    </tr>
  );
}

export default OrderRow;