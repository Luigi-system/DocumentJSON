import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

// Store active socket connections and their current template context if needed
// For simplicity, we'll just broadcast to all clients or filter by template ID on the client side

const PORT = 3001;
const CLIENT_URL = 'http://localhost:3000'; // Adjustment if your Vite runs on a different port

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
        // Launch puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // helpful for some environments
        });
        const page = await browser.newPage();

        // Construct URL to render the specific template with the provided data
        // We pass the data encoded in the URL or rely on the frontend to have received the socket event
        // A more robust way for "stateless" rendering involves passing data via a secondary mechanism 
        // or having the page wait for the data.
        // 
        // STRATEGY: 
        // Navigate to the editor in "render mode" and inject the data via a global variable or event.

        // Encode data safely (be careful with length limits, for large data this needs a different approach like local storage or a temp api)
        // For this POC, we will rely on the page fetching the latest data from the "server" or validation via socket, 
        // BUT since Puppeteer opens a NEW pure instance, it won't have the socket state.
        // 
        // OPTIMIZED STRATEGY:
        // We will inject the data directly into the page context using page.evaluate() after loading.

        const renderUrl = `${CLIENT_URL}/canvas/${templateId}?mode=render&templateId=${templateId}`;
        console.log(`Rendering PDF from: ${renderUrl}`);

        await page.goto(renderUrl, { waitUntil: 'networkidle0' });

        // Inject styles to ensure clean PDF (no gray background, no shadows on page)
        await page.addStyleTag({
            content: `
                body { background-color: white !important; }
                .page { box-shadow: none !important; border: none !important; margin: 0 auto !important; }
                .pages-container { gap: 0 !important; margin: 0 !important; width: 100% !important; }
                /* Hide scrollbars */
                ::-webkit-scrollbar { display: none; }
                /* Ensure parent containers don't add padding */
                .bg-editor-canvas { background-color: white !important; padding: 0 !important; }
            `
        });

        // Inject data into the page so it renders the correct content instantly
        await page.evaluate((injectData) => {
            // Assuming App.tsx exposes a function or we trigger a custom event
            window.postMessage({ type: 'INJECT_DATA', payload: injectData }, '*');
        }, data);

        // Wait a brief moment for React to re-render
        await new Promise(r => setTimeout(r, 1000));

        // We might need to adjust viewport to match template size (e.g. A4)
        // Taking A4 dimensions at 96 DPI roughly
        await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });

        const pdfBuffer = await page.pdf({
            printBackground: true,
            format: 'A4',
            // width: '816px', 
            // height: '1056px'
        });

        await browser.close();

        console.log('PDF Generated successfully.');

        // Return binary PDF with correct MIME type as requested
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            // Use 'inline' to view in browser, or 'attachment' to download. 
            // Note: 'inline' is better for previews.
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
