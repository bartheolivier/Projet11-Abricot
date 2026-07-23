import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useUserStore } from "../lib/useUserStore";
import { useEffect } from "react";

export function useProfileQuery(options = {}) {
  const setUser = useUserStore((state) => state.setUser);
  const getToken = useUserStore((state) => state.getToken);

  const token = getToken();

  const query = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.getProfile();
      return res.data;
    },
    enabled: !!token && options.enabled !== false,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}
