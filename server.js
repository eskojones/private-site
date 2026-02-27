const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// User Signup
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const userFile = path.join(DATA_DIR, `${username}.json`);

    if (fs.existsSync(userFile)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    const userData = { username, password }; // Note: In production, password should be hashed
    fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));

    res.status(201).json({ message: 'User created successfully' });
});

// User Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const userFile = path.join(DATA_DIR, `${username}.json`);

    if (!fs.existsSync(userFile)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = JSON.parse(fs.readFileSync(userFile, 'utf8'));

    if (userData.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', username });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
