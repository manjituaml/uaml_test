// OrderRow.jsx
import React from "react";
import { getDate } from "../../utils/dateConstant";

function OrderRow({ item, onClick }) {
  const amount = item.quantity * item.unitPrice;
  const remaining = item.quantity - (item.dispatchedQuantity || 0);
  console.log(item)
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
      <td>{getDate(item.plannedDispatchDate)}</td>
      <td>{getDate(item.closedItem)}</td>
    </tr>
  );
}

export default OrderRow;