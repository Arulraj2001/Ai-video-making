import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export function useHealth(pollIntervalMs: number = 30000, enabled: boolean = true) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState<boolean>(enabled);

  const checkHealth = useCallback(async () => {
    if (!enabled) return;
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
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setChecking(false);
      return;
    }

    checkHealth();
    const interval = setInterval(checkHealth, pollIntervalMs);
    return () => clearInterval(interval);
  }, [checkHealth, enabled, pollIntervalMs]);

  return { isHealthy, checking, error, refetch: checkHealth };
}
