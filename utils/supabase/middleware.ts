import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasRouteAccess } from '@/lib/auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is trying to access admin routes
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  // Get user's role from profile
  const { data: profile } = await supabase
    .from('Profile')
    .select('role')
    .eq('userId', user?.id)
    .single();

  const role = profile?.role || 'user';
  const path = request.nextUrl.pathname;

  // Check if user has access to the requested route
  if (user && !hasRouteAccess(role, path)) {
    // User is authenticated but doesn't have access, redirect to unauthorized
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }
  
  if (!user && !hasRouteAccess(role, path)) {
    // User is not authenticated and trying to access protected route, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access admin routes, check admin permissions
  if (user && isAdminRoute) {
    try {
      // We need to check the user's role from the database
      // Since we can't easily access Prisma in middleware, we'll let the AdminAuthWrapper handle this
      // But we can add a basic check here if needed

      // For now, let the AdminAuthWrapper component handle the admin permission check
      // This middleware will just ensure the user is authenticated
    } catch (error) {
      console.error('Error checking admin permissions:', error)
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}