"use client";

import { useState, useEffect } from "react";

export function useClientOnly(): boolean {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}
