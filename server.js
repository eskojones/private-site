const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const PAGES_DIR = path.join(DATA_DIR, 'pages');

// Ensure pages directory exists
if (!fs.existsSync(PAGES_DIR)) {
    fs.mkdirSync(PAGES_DIR);
}

const USERS_DIR = path.join(DATA_DIR, 'users');

// Ensure users directory exists
if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('html'));

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'html'));

// --- Authentication Middleware (Mock) ---
const checkAdmin = (req, res, next) => {
    const isAdmin = req.headers['x-admin-status'] === 'true';
    if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    next();
};

// --- API Endpoints ---

// API to get page list for navigation
app.get('/api/nav', (req, res) => {
    try {
        const files = fs.readdirSync(PAGES_DIR);
        const nav = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const content = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf8'));
                return { slug: content.slug, title: content.title };
            });
        res.json(nav);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch navigation' });
    }
});

// CMS API Endpoints
app.get('/api/pages/:slug', checkAdmin, (req, res) => {
    const slug = req.params.slug;
    const pagePath = path.join(PAGES_DIR, `${slug}.json`);
    if (fs.existsSync(pagePath)) {
        const data = JSON.parse(fs.readFileSync(pagePath, 'utf8'));
        res.json(data);
    } else {
        res.status(404).json({ error: 'Page not found' });
    }
});

app.post('/api/pages', checkAdmin, (req, res) => {
    const pageData = req.body;
    const pagePath = path.join(PAGES_DIR, `${pageData.slug}.json`);
    if (fs.existsSync(pagePath)) {
        return res.status(400).json({ error: 'Page already exists' });
    }
    fs.writeFileSync(pagePath, JSON.stringify(pageData, null, 2));
    res.status(201).json(pageData);
});

app.put('/api/pages/:oldSlug', checkAdmin, (req, res) => {
    const oldSlug = req.params.oldSlug;
    const pageData = req.body;
    const oldPath = path.join(PAGES_DIR, `${oldSlug}.json`);
    const newPath = path.join(PAGES_DIR, `${pageData.slug}.json`);

    if (fs.existsSync(oldPath)) {
        if (oldSlug !== pageData.slug && fs.existsSync(newPath)) {
            return res.status(400).json({ error: 'New slug already exists' });
        }
        if (oldSlug !== pageData.slug) {
            fs.unlinkSync(oldPath);
        }
        fs.writeFileSync(newPath, JSON.stringify(pageData, null, 2));
        res.json(pageData);
    } else {
        res.status(404).json({ error: 'Page not found' });
    }
});

app.delete('/api/pages/:slug', checkAdmin, (req, res) => {
    const slug = req.params.slug;
    if (slug === 'index') return res.status(400).json({ error: 'Cannot delete home page' });
    const pagePath = path.join(PAGES_DIR, `${slug}.json`);
    if (fs.existsSync(pagePath)) {
        fs.unlinkSync(pagePath);
        res.json({ message: 'Page deleted' });
    } else {
        res.status(404).json({ error: 'Page not found' });
    }
});

// User Signup
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const userFile = path.join(USERS_DIR, `${username}.json`);

    if (fs.existsSync(userFile)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    // Check if this is the first user (if so, make them admin)
    const existingUsers = fs.readdirSync(USERS_DIR);
    const isAdmin = existingUsers.length === 0;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = { username, password: hashedPassword, admin: isAdmin };
    fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));

    res.status(201).json({ 
        message: 'User created successfully', 
        admin: isAdmin 
    });
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const userFile = path.join(USERS_DIR, `${username}.json`);

    if (!fs.existsSync(userFile)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = JSON.parse(fs.readFileSync(userFile, 'utf8'));

    // Compare password
    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', username, admin: userData.admin || false });
});

// --- Page Routes ---

app.get('/dashboard', (req, res) => res.render('dashboard', { title: 'Dashboard' }));
app.get('/cms', (req, res) => res.render('cms', { title: 'CMS Dashboard' }));

// Dynamic Page Routes
app.get(['/', '/:slug'], (req, res, next) => {
    const slug = req.params.slug || 'index';
    
    if (slug === 'api' || req.url.startsWith('/api')) return next();
    if (slug.includes('.')) return next();
    if (slug === 'dashboard' || slug === 'cms') return next();

    const pagePath = path.join(PAGES_DIR, `${slug}.json`);

    if (fs.existsSync(pagePath)) {
        const pageData = JSON.parse(fs.readFileSync(pagePath, 'utf8'));
        
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
    } else {
        res.status(404).render('page', {
            title: '404 - Not Found',
            hero: { title: '404', subtitle: 'Page not found' },
            content: []
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
