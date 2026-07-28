import { createHmac } from "node:crypto";

/**
 * 네이버 검색광고 API 서명 생성.
 * 공식 스펙: signature = base64(HMAC-SHA256(secretKey, `${timestamp}.${method}.${uri}`))
 * uri는 쿼리스트링을 제외한 path만 사용한다.
 */
export function buildSignature(params: {
  timestamp: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  secretKey: string;
}): string {
  const { timestamp, method, path, secretKey } = params;
  const message = `${timestamp}.${method}.${path}`;
  return createHmac("sha256", secretKey).update(message).digest("base64");
}

export function buildAuthHeaders(params: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  apiKey: string;
  secretKey: string;
  customerId: string;
}): Record<string, string> {
  const timestamp = Date.now().toString();
  const signature = buildSignature({
    timestamp,
    method: params.method,
    path: params.path,
    secretKey: params.secretKey,
  });

  return {
    "X-Timestamp": timestamp,
    "X-API-KEY": params.apiKey,
    "X-Customer": params.customerId,
    "X-Signature": signature,
  };
}
