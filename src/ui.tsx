/** @jsxImportSource https://esm.sh/preact */

import type { ComponentChildren } from "npm:preact";

export function Layout({ children }) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://cdn.jsdelivr.net/npm/daisyui@4.12.13/dist/full.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <header>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/links">My Links</a></li>
              <li><a href="/links/new">Create Links</a></li>
            </ul>
          </nav>
        </header>

        <main>
          {children}
        </main>

      </body>
    </html>
  );
}

export function HomePage({ user }) {
  return (
    <Layout>
      <div>
        <div>
          <div>
            <h1>Welcome to link.fireship.app</h1>
            {user ? (
              <div>
                <div>Welcome back, {user.login}!</div>
                <div>
                  <a href="/links/new">Create New Link</a>
                  <a href="/oauth/signout">Sign Out</a>
                </div>
              </div>
            ) : (
              <a href="/oauth/signin">Sign In with GitHub</a>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}