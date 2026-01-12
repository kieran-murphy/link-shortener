/** @jsxImportSource https://esm.sh/preact */
import type { ComponentChildren } from "npm:preact";

export function Layout({ children }: { children: ComponentChildren }) {
  return (
    <html data-theme="cupcake"> {/* DaisyUI theme */}
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://cdn.jsdelivr.net/npm/daisyui@4.12.13/dist/full.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Link App</title>
      </head>
      <body class="min-h-screen bg-base-200 text-base-content">
        <header class="navbar bg-base-100 shadow-md px-6">
          <div class="flex-1">
            <a href="/" class="text-xl font-bold text-primary">link.fireship.app</a>
          </div>
          <nav>
            <ul class="menu menu-horizontal px-1">
              <li><a href="/" class="hover:text-primary">Home</a></li>
              <li><a href="/links" class="hover:text-primary">My Links</a></li>
              <li><a href="/links/new" class="hover:text-primary">Create Links</a></li>
            </ul>
          </nav>
        </header>

        <main class="flex flex-col items-center justify-center py-10 px-4">
          {children}
        </main>

        <footer class="footer footer-center bg-base-100 text-base-content p-4 mt-auto border-t">
          <aside>
            <p>© {new Date().getFullYear()} link.fireship.app</p>
          </aside>
        </footer>
      </body>
    </html>
  );
}

export function HomePage({ user }: { user?: { login: string } }) {
  return (
    <Layout>
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
          <h1 class="card-title text-3xl font-bold">Welcome to link.fireship.app</h1>
          {user ? (
            <>
              <p class="text-lg">Welcome back, <span class="font-semibold">{user.login}</span>!</p>
              <div class="card-actions mt-4">
                <a href="/links/new" class="btn btn-primary">Create New Link</a>
                <a href="/oauth/signout" class="btn btn-outline">Sign Out</a>
              </div>
            </>
          ) : (
            <a href="/oauth/signin" class="btn btn-primary mt-4">Sign In with GitHub</a>
          )}
        </div>
      </div>
    </Layout>
  );
}
