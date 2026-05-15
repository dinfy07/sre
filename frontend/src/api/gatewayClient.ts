const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export type ServiceHealth = {
  service: string;
  status: string;
  uptime: number;
  version: string;
  timestamp: string;
};

export type Order = {
  id: string;
  userId: string;
  status: string;
  total: number;
};

export async function fetchServiceHealth(servicePath: string): Promise<ServiceHealth> {
  const response = await fetch(`${apiBaseUrl}/${servicePath}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed for ${servicePath}`);
  }
  return response.json();
}

export async function createOrder(): Promise<Order> {
  const response = await fetch(`${apiBaseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: "demo-user",
      items: [
        {
          productId: "sku-platform",
          quantity: 1
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("Order creation failed");
  }

  return response.json();
}

