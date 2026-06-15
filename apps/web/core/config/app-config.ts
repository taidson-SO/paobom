export type AppConfig = {
  appName: string;
  apiBaseUrl: string;
  apiDefaultEmail: string;
  apiDefaultPassword: string;
};

export const appConfig: AppConfig = {
  appName: "Paobom",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3333",
  apiDefaultEmail:
    process.env.NEXT_PUBLIC_API_DEFAULT_EMAIL ?? "dono@paobom.local",
  apiDefaultPassword:
    process.env.NEXT_PUBLIC_API_DEFAULT_PASSWORD ?? "Paobom@123",
};
