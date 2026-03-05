import { useEffect, useState } from "react";
import axios from "axios";
import { baseOrderUrlPrefix, baseUrl, baseUserUrlPrefix } from "../utils/baseUrl";

const useGetAllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}${baseOrderUrlPrefix}`,{withCredentials: true});

      if (res.data.success) {
        setOrders(res.data.orders);
      } else {
        setError("Failed to load users");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
  };
};

export default useGetAllOrders;
