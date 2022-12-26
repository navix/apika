export function err(message: string, {statusCode = 500, data}: {statusCode?: number; data?: any} = {}) {
  return {
    statusCode,
    message,
    ...(data ? {data} : {}),
  };
}
