require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 5000
});

app.get('/api/faculty', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT * FROM faculty_directory ORDER BY sn ASC;');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

app.get('/api/phd-registry', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT * FROM phd_awards ORDER BY sn ASC;');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

app.post('/api/auth/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === (process.env.ADMIN_USER || 'ipu') && password === (process.env.ADMIN_PASSWORD || 'project11')) {
        res.status(200).json({ status: "AUTHORIZED", token: "USBAS_2026_SECURE" });
    } else {
        res.status(401).json({ status: "UNAUTHORIZED" });
    }
});

// --- WILDCARD ROUTE PLACED AT THE VERY BOTTOM OF THE FILE ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- AUTOMATED SCHEMAS INITIALIZER ENGINE ---
async function bootStrapDatabaseEngine() {
    let client;
    try {
        client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS faculty_directory (id SERIAL PRIMARY KEY, sn INT UNIQUE NOT NULL, name TEXT NOT NULL, designation TEXT NOT NULL, email TEXT NOT NULL, profile_link TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS phd_awards (id SERIAL PRIMARY KEY, sn INT UNIQUE NOT NULL, scholar_name TEXT NOT NULL, thesis_title TEXT NOT NULL, supervisor_name TEXT NOT NULL, passing_year INT NOT NULL);
        `);

        const dataPath = path.join(__dirname, 'data.json');
        if (!fs.existsSync(dataPath)) return;
        const sourceData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        const facultyCount = await client.query('SELECT COUNT(*) FROM faculty_directory;');
        if (parseInt(facultyCount.rows[0].count) === 0) {
            for (const f of sourceData.faculty) {
                await client.query('INSERT INTO faculty_directory (sn, name, designation, email, profile_link) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;', [f.sn, f.name, f.designation, f.email, f.link]);
            }
        }

        const phdCount = await client.query('SELECT COUNT(*) FROM phd_awards;');
        if (parseInt(phdCount.rows[0].count) === 0) {
            for (const p of sourceData.phd) {
                await client.query('INSERT INTO phd_awards (sn, scholar_name, thesis_title, supervisor_name, passing_year) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;', [p.sn, p.scholar, p.title, p.supervisor, p.year]);
            }
            console.log('[SYSTEM]: Seeding automation complete. All database parameters verified.');
        }
    } catch (err) {
        console.error('[DATABASE VERIFICATION ABORTED]:', err.message);
    } finally {
        if (client) client.release();
    }
}

app.listen(PORT, () => {
    console.log(`[USBAS RUNTIME SYSTEM ENGINE LIVE]: Processing port : ${PORT}`);
    bootStrapDatabaseEngine();
});
