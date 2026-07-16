# GoDaddy Web Hosting Economy Plan Limitations

## Purpose

This document defines the confirmed capabilities and limitations of
**GoDaddy Web Hosting Economy (Linux + cPanel)**. Use these rules when
reviewing the project for deployment compatibility.

------------------------------------------------------------------------

# Confirmed Hosting Environment

Treat the following as **facts**:

-   Linux + Apache + cPanel hosting
-   Website is deployed by uploading files into `public_html`
-   Hosting serves **static files only**
-   No server-side build process
-   No Node.js runtime
-   No Bun runtime
-   No npm execution
-   No Vite dev server
-   No React runtime
-   No server functions
-   No SSR
-   No Edge Functions
-   No API runtime
-   No Docker
-   No databases required
-   HTTPS is provided through the hosting SSL
-   `.htaccess` is supported
-   `robots.txt`, `sitemap.xml`, `404.html`, XML files, SVGs and other
    static assets are supported
-   FTP and cPanel File Manager are available

Deployment flow:

``` text
Local Machine
    ↓
node build.js
    ↓
dist/
    ↓
Upload ONLY the contents of dist/
    ↓
public_html
    ↓
Website Live
```

No source code, build tools, or development dependencies will exist on
the server.

------------------------------------------------------------------------

# STRICT REVIEW RULES

## 1. Inspect the Entire Project

Review:

-   Every HTML file
-   Every CSS file
-   Every JavaScript file
-   Every asset
-   Every configuration file
-   `build.js`
-   `package.json`
-   Directory structure
-   Imports
-   Asset paths
-   Routing
-   External dependencies
-   CDN usage

------------------------------------------------------------------------

## 2. Runtime Dependency Audit

Identify anything that requires:

-   Node.js runtime
-   Bun
-   npm
-   Vite
-   React runtime
-   React Router
-   TanStack Router
-   Express
-   PHP
-   Database
-   Environment variables
-   Server Functions
-   Server APIs
-   File system access
-   Dynamic rendering
-   SSR
-   Middleware

If **any** dependency exists, identify it explicitly.

------------------------------------------------------------------------

## 3. Build Verification

Verify that after running:

``` bash
node build.js
```

all required runtime files exist inside:

``` text
dist/
```

Nothing outside `dist/` should be required for production.

------------------------------------------------------------------------

## 4. Path Verification

Verify:

-   CSS paths
-   JavaScript paths
-   Image paths
-   SVG paths
-   Favicon
-   Fonts
-   Relative URLs
-   Internal links
-   Navigation
-   `404.html`
-   `robots.txt`
-   `sitemap.xml`

No broken paths.

------------------------------------------------------------------------

## 5. Browser Compatibility

Confirm:

-   No unsupported browser APIs
-   No module loading problems
-   No ES module runtime issues
-   No MIME type issues
-   No import/export runtime failures

------------------------------------------------------------------------

## 6. GSAP Review

Confirm:

-   CDN loading is correct
-   ScrollTrigger registration is correct
-   Nothing depends on npm packages at runtime

------------------------------------------------------------------------

## 7. Forms

Verify that forms depend only on external services such as:

-   Web3Forms
-   Formspree
-   Equivalent third-party endpoint

There must be **zero backend dependency**.

------------------------------------------------------------------------

## 8. Security Review

Identify:

-   Mixed content
-   Insecure assets
-   CORS issues
-   CSP issues
-   Cross-origin issues

------------------------------------------------------------------------

## 9. Apache Compatibility

Review whether the project requires:

-   Rewrite rules
-   MIME configuration
-   Directory indexes
-   `ErrorDocument`
-   Cache headers

If required, generate the exact `.htaccess`.

------------------------------------------------------------------------

# Final Verdict

Only one of the following conclusions is allowed:

## ✅ 100% Compatible

No changes required.

------------------------------------------------------------------------

## ⚠ Compatible After Fixes

List every required fix.

------------------------------------------------------------------------

## ❌ Not Compatible

Explain exactly why.

------------------------------------------------------------------------

# Important

Do **not**:

-   Assume compatibility
-   Guess
-   Say "it should work"
-   Say "probably"
-   Give generic answers

Only declare **100% Compatible** after verifying every file, dependency,
asset, path, and runtime requirement against the confirmed GoDaddy Web
Hosting Economy environment.
