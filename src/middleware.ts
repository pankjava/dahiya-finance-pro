import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register"];
const authPaths = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth")?.value;
  const isAuth = !!token;
  const path = req.nextUrl.pathname;
  const isPublic = publicPaths.some((p) => path === p || path.startsWith(p + "/"));
  const isAuthPage = authPaths.some((p) => path === p);

  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (!isPublic && !isAuth && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (!isAuth && (path === "/" || path === "")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*"],
};
