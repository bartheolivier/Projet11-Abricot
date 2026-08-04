import { NextResponse } from 'next/server';

// On renomme la fonction "middleware" en "proxy"
export function proxy(request) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/profile') ||
    path.startsWith('/projects');

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/projects/:path*'],
};
