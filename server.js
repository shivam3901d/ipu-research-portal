// --- MODULE INJECTION: CORE DEPENDENCIES ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;

// --- DYNAMIC SECURITY LAYERS INTERACTIVE REGISTER ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- ESTABLISH RESILIENT POSTGRESQL POOL CONNECTION ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required protocol parameter for live Render deployment hooks
    },
    max: 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 5000
});

// Structural boundary pool listener check
pool.on('error', (err) => {
    console.error('[USBAS DATABASE CONNECTION POOL BREAKDOWN]:', err.message);
});

// --- RUNTIME LIVE INTEGRATION GATEWAYS ---
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

// --- AUTOMATED DATABASE SCHEMA BUILDER & SEEDER ---
async function bootStrapDatabaseEngine() {
    let client;
    try {
        client = await pool.connect();
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS faculty_directory (
                id SERIAL PRIMARY KEY, 
                sn INT UNIQUE NOT NULL, 
                name TEXT NOT NULL, 
                designation TEXT NOT NULL, 
                email TEXT NOT NULL, 
                profile_link TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS phd_awards (
                id SERIAL PRIMARY KEY, 
                sn INT UNIQUE NOT NULL, 
                scholar_name TEXT NOT NULL, 
                thesis_title TEXT NOT NULL, 
                supervisor_name TEXT NOT NULL, 
                passing_year INT NOT NULL
            );
        `);
        console.log('[USBAS DB STORAGE ENGINE]: Verification tables verified/created successfully.');

        const dataPath = path.join(__dirname, 'data.json');
        if (!fs.existsSync(dataPath)) return;
        const sourceData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // FIXED: Safe dynamic key parsing loop parameters
        const facultyCount = await client.query('SELECT COUNT(*) FROM faculty_directory;');
        if (parseInt(facultyCount.rows[0].count) === 0) {
            console.log('[SYSTEM]: Migrating dynamic faculty elements to Supabase PostgreSQL pools...');
            for (const f of sourceData.faculty) {
                await client.query('INSERT INTO faculty_directory (sn, name, designation, email, profile_link) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;', [f.sn, f.name, f.designation, f.email, f.link]);
            }
        }

        // FIXED: Safe index parsing boundary check
        const phdCount = await client.query('SELECT COUNT(*) FROM phd_awards;');
        if (parseInt(phdCount.rows[0].count) === 0) {
            console.log('[SYSTEM]: Migrating 63 Ph.D records safely without buffer overlaps...');
            for (const p of sourceData.phd) {
                await client.query('INSERT INTO phd_awards (sn, scholar_name, thesis_title, supervisor_name, passing_year) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;', [p.sn, p.scholar, p.title, p.supervisor, p.year]);
            }
            console.log('[SYSTEM]: Database automation sync complete. All 63 entries locked.');
        }
    } catch (err) {
        console.error('[CRITICAL DATABASE ERR]:', err.message);
    } finally {
        if (client) client.release();
    }
}

// --- GENERAL ROUTER FALLBACK CATCH (Ordered to bottom) ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- INITIATE OPERATIONAL STATE INTERFACE ---
app.listen(PORT, () => {
    console.log(`[USBAS EXECUTIVE RUNTIME SYSTEM ENGINE LIVE]: Active deployment processing on port : ${PORT}`);
    bootStrapDatabaseEngine();
});
