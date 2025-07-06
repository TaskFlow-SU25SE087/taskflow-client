import { useEffect, useState } from "react";
import axios from "../configs/axiosClient";

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios.get(`/user/${userId}`)
      .then(res => setProfile(res.data.data))
      .finally(() => setLoading(false));
  }, [userId]);

  return { profile, loading };
} 