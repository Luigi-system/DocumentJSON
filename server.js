import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
// Allow connections from Vite dev server
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for dev simplicity
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const PORT = 3001;
const CLIENT_URL = 'http://localhost:3000'; // Adjustment if your Vite runs on a different port

const DATA_FILE = './templates.json';

app.post('/api/templates', async (req, res) => {
    await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
});

app.get('/api/templates', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch {
        res.json([]);
    }
});

console.log(`Starting server on port ${PORT}...`);

// Webhook Endpoint
app.post('/api/webhook/:templateId', async (req, res) => {
    const { templateId } = req.params;
    const data = req.body.data;

    if (!data) {
        return res.status(400).json({ error: 'Missing "data" field in JSON body.' });
    }

    console.log(`Webhook received for template: ${templateId}`);

    // 1. Notify Frontend to update UI
    io.emit('webhook-update', { templateId, data });

    // 2. Generate PDF using Puppeteer
    try {
        // Read templates from backend storage so Puppeteer doesn't rely on empty localStorage
        let allTemplates = [];
        try {
            const fileData = await fs.readFile(DATA_FILE, 'utf-8');
            allTemplates = JSON.parse(fileData);
        } catch (e) {
            console.log('No backend templates found, Puppeteer might fail if not using predefined templates.');
        }
        const targetTemplate = allTemplates.find(t => t.id === templateId);

        // Launch puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Inject data AND the specific template into the page
        await page.evaluateOnNewDocument((injectData, injectTemplate) => {
            window.__INJECTED_DATA__ = injectData;
            window.__INJECTED_TEMPLATE__ = injectTemplate;
        }, data, targetTemplate);

        const renderUrl = `${CLIENT_URL}/canvas/${templateId}?mode=render&templateId=${templateId}`;
        console.log(`Rendering PDF from: ${renderUrl}`);

        await page.goto(renderUrl, { waitUntil: 'networkidle0' });

        // Inject styles to ensure clean PDF
        await page.addStyleTag({
            content: `
                body { background-color: white !important; }
                .page { box-shadow: none !important; border: none !important; margin: 0 auto !important; }
                .pages-container { gap: 0 !important; margin: 0 !important; width: 100% !important; }
                ::-webkit-scrollbar { display: none; }
                .bg-editor-canvas { background-color: white !important; padding: 0 !important; }
            `
        });

        // Fallback postMessage just in case
        await page.evaluate((injectData) => {
            window.postMessage({ type: 'INJECT_DATA', payload: injectData }, '*');
        }, data);

        // Wait a brief moment for React to re-render
        await new Promise(r => setTimeout(r, 1000));

        await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });

        const pdfBuffer = await page.pdf({
            printBackground: true,
            format: 'A4',
        });

        await browser.close();

        console.log('PDF Generated successfully.');

        // Return binary PDF with correct MIME type
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="document-${templateId}.pdf"`
        });

        res.send(Buffer.from(pdfBuffer));

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Webhook URL format: http://localhost:${PORT}/api/webhook/:templateId`);
});
