import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      if (errorData.message) {
        throw new Error(errorData.message);
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    } catch (parseError) {
      // If JSON parsing fails, fallback to text
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Validate HTTP method
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const upperMethod = (method || '').toString().toUpperCase();
  
  if (!validMethods.includes(upperMethod)) {
    throw new Error(`Invalid HTTP method: ${method}`);
  }

  const res = await fetch(url, {
    method: upperMethod,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      staleTime: 0, // Always consider data stale for fresh stock data
      gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes only
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
