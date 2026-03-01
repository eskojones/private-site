require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { marked } = require('marked');
const bcrypt = require('bcryptjs');
const yaml = require('js-yaml');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Load configuration
let config = {
    server: { port: process.env.PORT || 3000 },
    paths: {
        data_dir: 'data',
        pages_dir: 'data/pages',
        users_dir: 'data/users'
    }
};

try {
    const fileContents = fsSync.readFileSync('server.conf', 'utf8');
    const loadedConfig = yaml.load(fileContents);
    config = { ...config, ...loadedConfig };
} catch (e) {
    console.warn('Could not load server.conf, using default settings');
}

const app = express();
const PORT = config.server.port;
const DATA_DIR = path.isAbsolute(config.paths.data_dir) ? config.paths.data_dir : path.join(__dirname, config.paths.data_dir);
const PAGES_DIR = path.isAbsolute(config.paths.pages_dir) ? config.paths.pages_dir : path.join(__dirname, config.paths.pages_dir);
const USERS_DIR = path.isAbsolute(config.paths.users_dir) ? config.paths.users_dir : path.join(__dirname, config.paths.users_dir);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-this';

// Ensure directories exist (synchronous at startup is acceptable)
[DATA_DIR, PAGES_DIR, USERS_DIR].forEach(dir => {
    if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
    }
});

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"], // Allow script.js and inline scripts for now
        },
    },
}));
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json({ limit: '1mb' })); // Limit request size
app.use(cookieParser());
app.use(express.static('html'));

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'html'));

// Rate Limiter for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: { error: 'Too many login/signup attempts, please try again later' }
});

// --- Utility Functions ---
const sanitizeSlug = (slug) => {
    if (typeof slug !== 'string') return '';
    return slug.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 100);
};

// --- Authentication Middleware ---
const checkAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    
    // Also check for token in cookies (for SSR and simplicity)
    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        if (!user.admin) return res.status(403).json({ error: 'Forbidden: Admins only' });
        req.user = user;
        next();
    });
};

// --- API Endpoints ---

// API to get page list for navigation
app.get('/api/nav', async (req, res) => {
    try {
        const files = await fs.readdir(PAGES_DIR);
        const nav = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = JSON.parse(await fs.readFile(path.join(PAGES_DIR, file), 'utf8'));
                if (content.showInNav !== false) {
                    nav.push({ 
                        slug: content.slug, 
                        title: content.title,
                        showInNav: true
                    });
                }
            }
        }
        res.json(nav);
    } catch (err) {
        console.error('Error fetching navigation:', err);
        res.status(500).json({ error: 'Failed to fetch navigation' });
    }
});

// CMS API Endpoints
app.get('/api/pages/:slug', checkAdmin, async (req, res) => {
    const slug = sanitizeSlug(req.params.slug);
    if (!slug) return res.status(400).json({ error: 'Invalid slug' });
    
    const pagePath = path.join(PAGES_DIR, `${slug}.json`);
    try {
        const data = JSON.parse(await fs.readFile(pagePath, 'utf8'));
        res.json(data);
    } catch (err) {
        res.status(404).json({ error: 'Page not found' });
    }
});

app.post('/api/pages', checkAdmin, async (req, res) => {
    const pageData = req.body;
    pageData.slug = sanitizeSlug(pageData.slug);
    
    if (!pageData.slug) return res.status(400).json({ error: 'Invalid slug' });
    
    const pagePath = path.join(PAGES_DIR, `${pageData.slug}.json`);
    try {
        await fs.access(pagePath);
        return res.status(400).json({ error: 'Page already exists' });
    } catch {
        await fs.writeFile(pagePath, JSON.stringify(pageData, null, 2));
        res.status(201).json(pageData);
    }
});

app.put('/api/pages/:oldSlug', checkAdmin, async (req, res) => {
    const oldSlug = sanitizeSlug(req.params.oldSlug);
    const pageData = req.body;
    pageData.slug = sanitizeSlug(pageData.slug);

    if (!oldSlug || !pageData.slug) return res.status(400).json({ error: 'Invalid slug' });

    const oldPath = path.join(PAGES_DIR, `${oldSlug}.json`);
    const newPath = path.join(PAGES_DIR, `${pageData.slug}.json`);

    try {
        await fs.access(oldPath);
        if (oldSlug !== pageData.slug) {
            try {
                await fs.access(newPath);
                return res.status(400).json({ error: 'New slug already exists' });
            } catch {
                await fs.unlink(oldPath);
            }
        }
        await fs.writeFile(newPath, JSON.stringify(pageData, null, 2));
        res.json(pageData);
    } catch {
        res.status(404).json({ error: 'Page not found' });
    }
});

app.delete('/api/pages/:slug', checkAdmin, async (req, res) => {
    const slug = sanitizeSlug(req.params.slug);
    if (slug === 'index') return res.status(400).json({ error: 'Cannot delete home page' });
    if (!slug) return res.status(400).json({ error: 'Invalid slug' });

    const pagePath = path.join(PAGES_DIR, `${slug}.json`);
    try {
        await fs.unlink(pagePath);
        res.json({ message: 'Page deleted' });
    } catch {
        res.status(404).json({ error: 'Page not found' });
    }
});

// User Signup
app.post('/api/signup', authLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password || username.length < 3 || password.length < 8) {
        return res.status(400).json({ error: 'Username (min 3) and password (min 8) required' });
    }

    const sanitizedUsername = sanitizeSlug(username);
    const userFile = path.join(USERS_DIR, `${sanitizedUsername}.json`);

    try {
        await fs.access(userFile);
        return res.status(409).json({ error: 'User already exists' });
    } catch {
        // Check if this is the first user (if so, make them admin)
        const files = await fs.readdir(USERS_DIR);
        const isAdmin = files.length === 0;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        const userData = { username: sanitizedUsername, password: hashedPassword, admin: isAdmin };
        await fs.writeFile(userFile, JSON.stringify(userData, null, 2));

        res.status(201).json({ 
            message: 'User created successfully', 
            admin: isAdmin 
        });
    }
});

// User Login
app.post('/api/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const sanitizedUsername = sanitizeSlug(username);
    const userFile = path.join(USERS_DIR, `${sanitizedUsername}.json`);

    try {
        const userData = JSON.parse(await fs.readFile(userFile, 'utf8'));
        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { username: userData.username, admin: !!userData.admin },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Set secure cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000 // 2 hours
        });

        res.json({ 
            message: 'Login successful', 
            token,
            user: { username: userData.username, admin: !!userData.admin }
        });
    } catch {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// User Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
});

// --- Page Routes ---

app.get('/dashboard', (req, res) => res.render('dashboard', { title: 'Dashboard' }));
app.get('/cms', (req, res) => res.render('cms', { title: 'CMS Dashboard' }));

// Dynamic Page Routes
app.get(['/', '/:slug'], async (req, res, next) => {
    let slug = sanitizeSlug(req.params.slug || 'index');
    
    if (slug === 'api' || req.url.startsWith('/api')) return next();
    if (req.params.slug && req.params.slug.includes('.')) return next();
    if (slug === 'dashboard' || slug === 'cms') return next();

    const pagePath = path.join(PAGES_DIR, `${slug}.json`);

    try {
        const pageData = JSON.parse(await fs.readFile(pagePath, 'utf8'));
        const isPublic = pageData.isPublic !== undefined ? pageData.isPublic : true;
        
        let isAdmin = false;
        if (req.cookies && req.cookies.token) {
            try {
                const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
                isAdmin = !!decoded.admin;
            } catch (e) {
                // Invalid token, treat as non-admin
            }
        }

        if (!isPublic && !isAdmin) {
            return res.status(403).render('page', {
                title: '403 - Forbidden',
                hero: { title: '403', subtitle: 'This page is private and requires administrator access.' },
                content: []
            });
        }
        
        // Parse Markdown in content chunks
        if (pageData.content && Array.isArray(pageData.content)) {
            pageData.content = pageData.content.map(section => {
                if (section.type === 'column-section' && section.columns) {
                    section.columns = section.columns.map(col => ({
                        ...col,
                        text: marked.parse(col.text || '')
                    }));
                } else if (section.type === 'text-section' && section.text) {
                    section.text = marked.parse(section.text);
                }
                return section;
            });
        }

        res.render('page', { 
            title: pageData.title,
            hero: pageData.hero,
            content: pageData.content || []
        });
    } catch {
        res.status(404).render('page', {
            title: '404 - Not Found',
            hero: { title: '404', subtitle: 'Page not found' },
            content: []
        });
    }
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
