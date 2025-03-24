# WhatsApp Bot

A WhatsApp bot built with wwebjs and Node.js that sends messages to WhatsApp contacts.

The bot uses the `LocalAuth` authentication strategy, requiring persistent storage to maintain sessions.

Make sure you have a powerful enough VPS , A `t3.micro` (AWS) instance can do the job (2vcpu cores , 1gb ram).

## Setup

### Local Development

To start the bot:

```bash
npm run dev
```

### Sending Messages

Send a `POST` request to:

```
localhost:3000/send-message
```

With the following JSON body:

```json
{
  "number": "+201012345678",
  "message": "MESSAGE"
}
```

## VPS Configuration

### Windows VPS

Make sure to open TCP port 3000 (or whichever port you've configured) to allow incoming connections.

### Linux Ubuntu VPS

#### Installing Dependencies

Install required Puppeteer dependencies:

```bash
sudo apt-get install libx11-xcb1 libxcomposite1 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6
```

#### Installing Chromium

Install Chromium in the project directory:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f
```

#### Enabling Puppeteer

After installing Chromium, enable it:

```bash
node node_modules/puppeteer/install.mjs
```
