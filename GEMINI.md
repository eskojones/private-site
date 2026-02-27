# GEMINI.md - Private Site Project Context

This document provides essential context and instructions for AI agents working on the "Private Site" project.

## Project Overview

**Private Site** is a responsive web application built with Node.js and Express. It features a custom, JSON-based Content Management System (CMS), Markdown support, and a secure user authentication system.

- **Frontend:** Server-side rendered (SSR) using EJS templates. Styled with modular Vanilla CSS.
- **Backend:** Node.js/Express.5x.
- **Data Storage:** Flat JSON files in the `data/` directory for both pages and user profiles.
- **Authentication:** Password hashing with `bcryptjs`. Session/Admin status currently managed via custom headers and local storage (transition to secure sessions is planned).
- **CMS:** Supports dynamic page creation, editing, and deletion. Includes a hierarchical tree-view explorer and visibility controls (`isPublic`, `showInNav`).

## Architecture & Key Files

- `server.js`: The central hub. Handles routing, API endpoints, authentication logic, and Markdown parsing via `marked`. Now loads configuration from `server.conf`.
- `server.conf`: YAML configuration file for port and directory paths.
- `data/pages/`: Contains page definitions as JSON.
    - Fields: `slug`, `title`, `hero` (title/subtitle), `content` (array of sections), `isPublic`, `showInNav`.
- `data/users/`: Stores user credentials and admin status (hashed passwords).
- `html/`:
    - `cms.ejs`: The administrative interface for page management.
    - `page.ejs`: The generic template for rendering CMS-driven pages.
    - `script.js`: Client-side logic for authentication, navigation, and modal management.
    - `css/`: Modular styles (`base.css`, `layout.css`, `components.css`, `cms.css`).

## Building and Running

### Commands

- **Install Dependencies:** `npm install`
- **Start Server:** `npm start` (Runs on `http://localhost:3000` by default)
- **Test:** `npm test` (Placeholder - unit tests for CMS API are TODO)

### Environment Prerequisites

- Node.js v14+
- The `data/` directory must be writable by the Node.js process.
- For production, use a process manager like `pm2`.

## Development Conventions

- **PowerShell Syntax:** Always use `;` instead of `&&` when chaining shell commands in this environment (Win32/PowerShell).
- **Security First:** Never log or commit plain-text passwords or sensitive user data. User data in `data/users/` is Git-ignored.
- **Surgical Updates:** When modifying `server.js` or `html/cms.ejs`, ensure that existing functionalities like the "Home" page deletion protection or the first-user-is-admin logic are preserved.
- **Style:** Adhere to the existing modular CSS architecture. Use CSS variables defined in `base.css` for consistency.
- **Markdown:** Use the `marked` library to parse the `text` field in content chunks before rendering.
- **Admin Access:** API endpoints for CMS operations must be protected by the `checkAdmin` middleware, which validates the `x-admin-status: true` header.

## Future Roadmap

1.  **Session Management:** Transition from `localStorage` flags to secure, server-side session/cookie management.
2.  **Asset Management:** Implement image and file upload capabilities in the CMS.
3.  **Testing:** Add a comprehensive test suite for the CMS API and page rendering logic.
4.  **Database Migration:** Consider moving from JSON files to a formal database for scalability.
