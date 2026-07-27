/**
 * ログイン情報
 */
export interface LoginResponse {
  csrfToken: string;
  private: number;
  userId: number;
  userName: string;
}
