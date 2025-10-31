import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export interface UserInfo {
  id: string;
  email: string | null;
  imageUrl: string;
  organizationID: string | null;
}

export const getUserInfo = api<{}, UserInfo>(
  { auth: true, expose: true, method: "GET", path: "/user/me" },
  async () => {
    const authData = getAuthData()!;
    return {
      id: authData.userID,
      email: authData.email,
      imageUrl: authData.imageUrl,
      organizationID: authData.organizationID,
    };
  }
);
