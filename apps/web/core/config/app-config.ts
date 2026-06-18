export type AppConfig = {
  appName: string;
  apiBaseUrl: string;
};

export const appConfig: AppConfig = {
  appName: "Paobom",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3333",
};
