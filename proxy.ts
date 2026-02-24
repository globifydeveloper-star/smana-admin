import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Define protected routes
    const isProtectedRoute = path.startsWith('/dashboard');

    // Check for authentication elements
    // We check for 'userInfo' which the frontend sets upon login
    // We also check for 'jwt' which the backend sets (httpOnly)
    const userInfo = request.cookies.get('userInfo')?.value;
    const jwt = request.cookies.get('jwt')?.value;

    if (isProtectedRoute && (!userInfo && !jwt)) {
        // Redirect to login page if trying to access protected route without auth
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.search = `?redirect=${path}`;
        return NextResponse.redirect(url);
    }

    if (path === '/login' && (userInfo || jwt)) {
        // Redirect to dashboard if already logged in and trying to access login
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
