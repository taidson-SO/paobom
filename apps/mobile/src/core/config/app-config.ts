export type AppConfig = {
  appName: string;
  apiBaseUrl: string;
};

export const appConfig: AppConfig = {
  appName: "Paobom",
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:3333",
};
