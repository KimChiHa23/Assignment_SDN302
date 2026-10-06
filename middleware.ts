import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "token";
const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "taskflow-super-secure-jwt-secret-assignment2-sdn302-2026";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token từ cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload && payload.id) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // Danh sách các trang bắt buộc phải đăng nhập
  const isProtectedPath =
    pathname.startsWith("/teams") ||
    pathname.startsWith("/dashboard");

  // Danh sách các trang chỉ dành cho khách (chưa đăng nhập)
  const isAuthPath =
    pathname === "/login" ||
    pathname === "/register";

  // 1. Chưa đăng nhập mà truy cập trang được bảo vệ -> Redirect về /login
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Đã đăng nhập mà truy cập /login hoặc /register -> Redirect vào /teams
  if (isAuthPath && isAuthenticated) {
    const teamsUrl = new URL("/teams", request.url);
    return NextResponse.redirect(teamsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Khớp với tất cả các đường dẫn cần bảo vệ hoặc chuyển hướng:
     * - /teams/:path*
     * - /dashboard/:path*
     * - /login
     * - /register
     */
    "/teams/:path*",
    "/teams",
    "/dashboard/:path*",
    "/dashboard",
    "/login",
    "/register",
  ],
};
