# Private Site

A responsive website with a Node.js/Express backend featuring user authentication and a JSON-based Content Management System (CMS) with Markdown support.

## Features

- **Dynamic CMS**: Manage site pages via a JSON-based file system.
- **Markdown Support**: Content chunks support Markdown for rich text formatting.
- **User Authentication**: Secure signup and login system.
- **Admin Dashboard**: Specialized CMS view for administrators to create, edit, and delete pages.
- **Page Explorer**: Hierarchical tree-view of all site pages.
- **Responsive Design**: Mobile-first UI with a custom CSS framework.
- **Server-Side Rendering**: Uses EJS templates for dynamic content delivery.

## Project Structure

- `server.js`: Express server with API and routing logic.
- `data/`: JSON storage for site content and user profiles.
    - `pages/`: Site page definitions.
    - `users/`: User profile data (Git ignored).
- `html/`: EJS templates and static assets.
    - `css/`: Modular CSS files (`base`, `layout`, `components`, `cms`).
    - `partials/`: Reusable EJS fragments (`head`, `header`, `scripts`).
- `package.json`: Project dependencies and scripts.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- npm (comes with Node.js)

## Getting Started

### 1. Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### 2. Running the Project

Start the local development server:

```bash
npm start
```

The site will be available at `http://localhost:3000`.

### 3. Setup Administrator

The first user to sign up via the UI will automatically be granted administrator privileges. Any subsequent users will be standard users by default.

## Deployment

### Local Deployment

The project is ready for local deployment using the steps above. Ensure the `data/` directory has write permissions for the Node.js process.

### Production Considerations

1. **Environment Variables**: Use a `.env` file to manage sensitive configurations like the `PORT`.
2. **Security**: 
   - User passwords are securely hashed using `bcryptjs`.
   - Use a production-ready session management system instead of the current mock headers.
3. **Storage**: For larger sites, consider migrating from the JSON file-based storage to a database like MongoDB or PostgreSQL.
4. **Process Manager**: Use `pm2` to keep the application running in a production environment:
   ```bash
   npm install pm2 -g
   pm2 start server.js --name "private-site"
   ```

## License

MIT
