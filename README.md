# whatsapp-bot

whatsapp-bot made with wwebjs and Node.js to send messages to WhatsApp.
It uses the auth strategy `LocalAuth`, so it needs persistent storage to store sessions.

## Setup

To start it:

```sh
npm start
```

Send a `POST` request to:

```
localhost:3001/send-message
```

With the following body:

```json
{
  "number": "+201012345678",
  "message": "MESSAGE"
}
```

### VPS Configuration

#### Windows VPS
Make sure to open the TCP port that you would send to. In this example, port `3001`.

#### Linux Ubuntu VPS (not supported yet)
You need to install some additional packages for Puppeteer. Run the following command:

```sh
sudo apt-get install libx11-xcb1 libxcomposite1 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6
