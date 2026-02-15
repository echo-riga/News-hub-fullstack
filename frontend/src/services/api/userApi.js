import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const userApi = {
  login: async (name) => {
    const res = await axios.post(`${API_URL}/api/users/find-or-create`, {
      name,
    });
    return res.data; // just the user object
  },
};
