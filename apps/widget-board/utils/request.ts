// Simple request utility stub
export async function request<T = any>(
  methodOrUrl: string,
  urlOrOptions?: string | RequestInit & { body?: any },
  options?: RequestInit & { body?: any }
): Promise<T> {
  let method = 'GET';
  let url = '';
  let config: RequestInit & { body?: any } = {};

  // Handle overloaded arguments
  if (typeof urlOrOptions === 'string') {
    method = methodOrUrl.toUpperCase();
    url = urlOrOptions;
    config = options || {};
  } else {
    url = methodOrUrl;
    config = urlOrOptions || {};
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
    ...config,
  };

  if (config.body) {
    fetchOptions.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
