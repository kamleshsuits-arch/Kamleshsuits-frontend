import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID,
};

export const userPool = new CognitoUserPool(poolData);

export const AWS_CONFIG = {
  region: import.meta.env.VITE_AWS_REGION || "ap-south-1",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
};
