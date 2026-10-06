import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AuthUser } from "@/types/auth";

export const AUTH_COOKIE_NAME = "token";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "taskflow-super-secure-jwt-secret-assignment2-sdn302-2026";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

// 1. Mã hóa mật khẩu người dùng
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// 2. So khớp mật khẩu đăng nhập với hash trong database
export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// 3. Ký JWT Token (hạn 7 ngày)
export async function signToken(payload: AuthUser): Promise<string> {
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// 4. Xác thực và giải mã JWT Token
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.id || !payload.email) return null;
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name as string) || "",
    };
  } catch {
    return null;
  }
}

// 5. Lấy User từ request (hỗ trợ cả Cookie và Authorization Header)
export async function getAuthUser(request?: Request): Promise<AuthUser | null> {
  try {
    let token: string | undefined;

    // Ưu tiên 1: Lấy từ Header `Authorization: Bearer <token>` nếu có
    if (request) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    }

    // Ưu tiên 2: Lấy từ cookie của request (nếu có request object)
    if (!token && request) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }
    }

    // Ưu tiên 3: Lấy từ next/headers cookies()
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
      } catch {
        // Fallback khi không trong request context của cookies()
      }
    }

    if (!token) return null;

    return await verifyToken(token);
  } catch {
    return null;
  }
}

// Cấu hình cookie an toàn
export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 ngày
  };
}
