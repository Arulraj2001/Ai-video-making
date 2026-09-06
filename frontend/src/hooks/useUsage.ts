import { useState, useEffect, useCallback } from "react";
import { api, type UsageResponse } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function useUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsage();
      setUsage(data);
    } catch (err: any) {
      // Don't show loud error in local offline mode
      setError(err?.message || "Failed to load usage");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    usage,
    loading,
    error,
    refreshUsage: fetchUsage,
  };
}
