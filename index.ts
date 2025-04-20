import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import * as dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';

// Load environment variables from .env file
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || '';
const LEAD_API_URL = process.env.LEAD_API_URL || 'http://localhost:3001/api/leads';

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
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// Track client ready state
let clientReady = false;

// Function to handle new leads (contacts not in your contact list)
const createLead = async (contact: any) => {
    try {
        console.log('Creating lead for contact:', contact.number);
        
        // Prepare lead data
        const leadData = {
            name: contact.pushname || contact.name || "whatsapp contact",
            number: contact.number,
            source: "whatsapp"
        };
        
        // Send POST request to the leads API with authorization header
        const response = await axios.post(LEAD_API_URL, leadData, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Lead created successfully:', response.data);
        return response.data;
    } catch (error: any) {
        // Check if error is a response from the server
        if (error.response) {
            // Handle duplicate number error (typically 409 Conflict or 400 Bad Request)
            if (error.response.status === 409 || 
                (error.response.status === 400 && error.response.data?.message?.includes('duplicate'))) {
                console.log('Lead already exists with this number:', contact.number);
                // You can add custom handling for duplicate leads here
                return { exists: true, message: 'Lead already exists' };
            }
            
            // Handle other server errors
            console.error('Server error creating lead:', error.response.status, error.response.data);
        } else if (error.request) {
            // Request was made but no response was received
            console.error('No response received from lead API:', error.request);
        } else {
            // Error setting up the request
            console.error('Error creating lead request:', error.message);
        }
        
        // Don't throw the error, just log it and continue
        return { success: false, error: error.message };
    }
};

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

    // Check if the message is from a WhatsApp contact not in your contacts
    const contact = await msg.getContact();
    if (!contact.isMyContact) {
    }
    
    await createLead(contact);

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

// Listening to all incoming messages
client.on('message_create', message => {
	console.log(message.body);
    console.log(message.getContact().then(contact => {
        console.log(contact.name); // Contact name
        console.log(contact.pushname); // Contact name
        console.log(contact.shortName); // Contact ID
        console.log(contact.number); // Contact name
        console.log(contact.isWAContact); // Contact name
        console.log(contact.isMyContact); // Contact name
    }));
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

// Endpoint to send a message with media to a phone number
app.post('/send-media-message', (req, res) => {
    (async () => {
        try {
            // Check if client is ready
            if (!clientReady) {
                return res.status(503).json({ 
                    success: false, 
                    message: 'WhatsApp client not ready. Please scan the QR code first.' 
                });
            }

            const { phoneNumber, message, media, sales } = req.body;
            
            // Validate request body
            if (!phoneNumber || !message) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Phone number and message are required' 
                });
            }

            // Format phone number (remove any non-numeric characters)
            let formattedNumber = phoneNumber.replace(/\D/g, '');
            
            // Add +20 prefix if not present
            if (!formattedNumber.startsWith('+')) {
                if (formattedNumber.startsWith('0')) {
                    formattedNumber = `+2${formattedNumber}`;
                } else {
                    formattedNumber = `+${formattedNumber}`;
                }
            }
            
            // Convert to WhatsApp format (number@c.us)
            const chatId = `${formattedNumber.replace('+', '')}@c.us`;
            
            console.log(`Attempting to send message to: ${chatId}`);
            
            // Send media files first if present
            if (media && Array.isArray(media) && media.length > 0) {
                for (const mediaUrl of media) {
                    try {
                        const mediaFile = await MessageMedia.fromUrl(mediaUrl);
                        await client.sendMessage(chatId, mediaFile);
                    } catch (mediaError) {
                        console.error(`Error sending media ${mediaUrl}:`, mediaError);
                    }
                }
            }
            
            // Send the text message
            const sentMessage = await client.sendMessage(chatId, message);
            
            res.status(200).json({ 
                success: true, 
                message: 'Message with media sent successfully',
                to: formattedNumber,
                messageId: sentMessage.id._serialized
            });
        } catch (error: any) {
            console.error('Error sending message with media:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send message with media',
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