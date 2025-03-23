import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import * as dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';

// Load environment variables from .env file
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3000;

// Create a WhatsApp client instance
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Create Express app
const app = express();
app.use(bodyParser.json());

// Track client ready state
let clientReady = false;

// WhatsApp client event handlers
client.on('qr', (qr) => {
    // Display QR code in terminal
    qrcode.generate(qr, { small: true });
    
    // Also log the QR code string for other potential uses
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
    clientReady = true;
});

client.on('message', async (msg) => {
    console.log('Message received:', msg.body);

    // Simple echo example - reply to messages starting with !echo
    if (msg.body.startsWith('!echo ')) {
        const response = msg.body.slice(6); // Remove the !echo prefix
        await msg.reply(response);
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected', reason);
    clientReady = false;
    // Attempt to reconnect
    client.initialize();
});

// Initialize WhatsApp client
client.initialize();

// API Endpoints
app.get('/', (req, res) => {
    res.send('WhatsApp Bot Server is running');
});

// Endpoint to send a message to a phone number - Fixed version
app.post('/send-message', (req, res) => {
    // Use a regular function instead of an async function
    (async () => {
        try {
            // Check if client is ready
            if (!clientReady) {
                return res.status(503).json({ 
                    success: false, 
                    message: 'WhatsApp client not ready. Please scan the QR code first.' 
                });
            }

            const { phoneNumber, message } = req.body;
            
            // Validate request body
            if (!phoneNumber || !message) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Phone number and message are required' 
                });
            }

            // Format phone number (remove any non-numeric characters)
            let formattedNumber = phoneNumber.replace(/\D/g, '');
            
            // Ensure the number has a "+" prefix
            if (!formattedNumber.startsWith('+')) {
                formattedNumber = `+${formattedNumber}`;
            }
            
            // Convert to WhatsApp format (number@c.us)
            const chatId = `${formattedNumber.replace('+', '')}@c.us`;
            
            console.log(`Attempting to send message to: ${chatId}`);
            
            // Send the message
            const sentMessage = await client.sendMessage(chatId, message);
            
            res.status(200).json({ 
                success: true, 
                message: 'Message sent successfully',
                to: formattedNumber,
                messageId: sentMessage.id._serialized
            });
        } catch (error: any) {
            console.error('Error sending message:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send message',
                error: error.message
            });
        }
    })();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    try {
        await client.destroy();
        console.log('WhatsApp client destroyed');
    } catch (error) {
        console.error('Error destroying client:', error);
    }
    process.exit(0);
});