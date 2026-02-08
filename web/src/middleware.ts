import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Dashboard ko private route declare karo
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/health(.*)',
  '/processes(.*)',
  '/power(.*)'
]);

const isOwnerRoute = createRouteMatcher([
  '/processes(.*)',
  '/power(.*)'
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth.protect();
  if (isOwnerRoute(req)) {
    const ownerId = process.env.OWNER_ID;
    const userId = auth().userId;
    if (ownerId && userId && userId !== ownerId) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
