import { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl, baseUserUrlPrefix } from "../utils/baseUrl";

const useGetAllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}${baseUserUrlPrefix}/getallusers`,{withCredentials: true});

      if (res.data.success) {
        setUsers(res.data.users);
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
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
};

export default useGetAllUsers;
