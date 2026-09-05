import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export function useHealth(pollIntervalMs: number = 30000) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState<boolean>(true);

  const checkHealth = useCallback(async () => {
    try {
      setChecking(true);
      const res = await api.getHealth();
      if (res.status === "ok") {
        setIsHealthy(true);
        setError(null);
      } else {
        setIsHealthy(false);
        setError(`Unexpected status: ${res.status}`);
      }
    } catch (err: any) {
      setIsHealthy(false);
      setError(err.message || "Failed to reach backend server");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, pollIntervalMs);
    return () => clearInterval(interval);
  }, [checkHealth, pollIntervalMs]);

  return { isHealthy, checking, error, refetch: checkHealth };
}
