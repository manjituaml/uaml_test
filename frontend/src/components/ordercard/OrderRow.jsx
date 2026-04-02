import React, { useEffect, useState } from "react";
import { getDate } from "../../utils/dateConstant";
import "./OrderRow.scss";
import axios from "axios";
import { baseOrderUrlPrefix, baseUrl } from "../../utils/baseUrl";
import { useSelector } from "react-redux";

function OrderRow({ item, onClick, refetch }) {
  const amount = item.quantity * item.unitPrice;
  const remaining = item.quantity - (item.dispatchedQuantity || 0);
  const { user } = useSelector((store) => store.auth);

  // ✅ Local state for instant UI update
  const [localStatus, setLocalStatus] = useState(item.planDateAction);
  const [loading, setLoading] = useState(false);

  // ✅ Sync when parent data changes
  useEffect(() => {
    setLocalStatus(item.planDateAction);
  }, [item.planDateAction]);

  const upadtePlanDateStatus = async (action) => {
    try {
      setLoading(true);

      // 🔥 Optimistic UI
      setLocalStatus(action);

      await axios.put(
        `${baseUrl}${baseOrderUrlPrefix}/${item?._id}`,
        { planDateAction: action },
        { withCredentials: true }
      );

      // ✅ Refresh parent data
      if (refetch) refetch();
    } catch (error) {
      console.error(error);

      // ❌ rollback if failed
      setLocalStatus(item.planDateAction);
    } finally {
      setLoading(false);
    }
  };

  const isMarketingManager =
    user?.department === "marketing" &&
    user?.jobPosition === "manager";

  return (
    <tr onClick={onClick} style={{ cursor: "pointer" }}>
      <td>
        {item.podate ? new Date(item.podate).toLocaleDateString() : "-"}
      </td>

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

      {/* ✅ PLAN DATE COLUMN */}
      <td className="planDateAction">
        {item.plannedDispatchDate && (
          <>
            {/* ✅ Always show date */}
            <div>{getDate(item.plannedDispatchDate)}</div>

            {/* ✅ Buttons ONLY for suggested + manager */}
            {localStatus === "suggested" && isMarketingManager && (
              <div className="planactionbutton">
                <button
                  className="declaredBtn"
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    upadtePlanDateStatus("declared");
                  }}
                >
                  {loading ? "..." : "Approve"}
                </button>

                <button
                  className="rejectedBtn"
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    upadtePlanDateStatus("rejected");
                  }}
                >
                  {loading ? "..." : "Cancel"}
                </button>
              </div>
            )}

            {/* ✅ Status */}
            {localStatus === "declared" && (
              <span className="status approved">✅ Approved</span>
            )}

            {localStatus === "rejected" && (
              <span className="status rejected">❌ Rejected</span>
            )}
          </>
        )}
      </td>

      <td>{getDate(item.closedItem)}</td>
    </tr>
  );
}

export default OrderRow;