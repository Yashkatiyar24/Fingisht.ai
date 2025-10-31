import { useAuth } from "@clerk/clerk-react";

// Use mock backend in development, real backend in production
let backend: any;

if (import.meta.env.DEV) {
  // Use mock backend in development
  import("./mockBackend").then(module => {
    backend = module.mockBackend;
  });
} else {
  // Use real backend in production
  import("~backend/client").then(module => {
    backend = module.default;
  });
}

// Fallback to mock backend if real backend fails to load
const getBackend = () => {
  if (!backend) {
    console.warn('Backend not loaded yet, using mock backend');
    return import("./mockBackend").then(module => module.mockBackend);
  }
  return Promise.resolve(backend);
};

export function useBackend() {
  const { getToken, isSignedIn } = useAuth();
  
  return {
    with: async (options: any) => {
      const b = await getBackend();
      if (options.auth && isSignedIn) {
        const token = await getToken();
        return {
          ...b,
          dashboard: {
            ...b.dashboard,
            getStats: async (params: any) => {
              return b.dashboard.getStats({
                ...params,
                headers: {
                  ...params?.headers,
                  ...(token ? { authorization: `Bearer ${token}` } : {}),
                },
              });
            },
          },
          ai: {
            ...b.ai,
            getInsights: async (params: any) => {
              return b.ai.getInsights({
                ...params,
                headers: {
                  ...params?.headers,
                  ...(token ? { authorization: `Bearer ${token}` } : {}),
                },
              });
            },
            getAnomalies: async (params: any) => {
              return b.ai.getAnomalies({
                ...params,
                headers: {
                  ...params?.headers,
                  ...(token ? { authorization: `Bearer ${token}` } : {}),
                },
              });
            },
          },
        };
      }
      return b;
    },
    dashboard: {
      getStats: async (params: any) => {
        const b = await getBackend();
        return b.dashboard.getStats(params);
      },
    },
    ai: {
      getInsights: async (params: any) => {
        const b = await getBackend();
        return b.ai.getInsights(params);
      },
      getAnomalies: async (params: any) => {
        const b = await getBackend();
        return b.ai.getAnomalies(params);
      },
    },
  };
}
