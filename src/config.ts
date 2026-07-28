import "dotenv/config";

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function required(name: string): string {
  const v = optional(name);
  if (!v) {
    throw new Error(
      `환경변수 ${name}가 설정되지 않았습니다. .env 파일을 확인하세요 (.env.example 참고).`
    );
  }
  return v;
}

export const config = {
  naverAd: {
    get apiKey() {
      return required("NAVER_AD_API_KEY");
    },
    get secretKey() {
      return required("NAVER_AD_SECRET_KEY");
    },
    get customerId() {
      return required("NAVER_AD_CUSTOMER_ID");
    },
  },
  naverOpenApi: {
    clientId: optional("NAVER_OPENAPI_CLIENT_ID"),
    clientSecret: optional("NAVER_OPENAPI_CLIENT_SECRET"),
    get isConfigured() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },
};
