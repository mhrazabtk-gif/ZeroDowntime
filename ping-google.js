const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const urlsFile = path.join(__dirname, 'urls.txt');
if (!fs.existsSync(urlsFile)) {
    console.log('urls.txt not found for Google Indexing.');
    process.exit(0);
}

const urlList = fs.readFileSync(urlsFile, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

if (urlList.length === 0) {
    console.log('No URLs to ping for Google Indexing.');
    process.exit(0);
}

const keyPathEnv = process.env.ACTIVE_KEY_PATH || 'keys/key-1.json';
const absoluteKeyPath = path.join(__dirname, keyPathEnv);

if (!fs.existsSync(absoluteKeyPath)) {
    console.error(`ERROR: Google key file not found at path: ${absoluteKeyPath}`);
    process.exit(1);
}

console.log(`Using Google Key file: ${keyPathEnv}`);

async function sendToGoogle() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: absoluteKeyPath,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        const client = await auth.getClient();
        const indexing = google.indexing({
            version: 'v3',
            auth: client,
        });

        const batchUrls = urlList.slice(0, 200);
        console.log(`Submitting ${batchUrls.length} URLs to Google Indexing API...`);

        for (const url of batchUrls) {
            try {
                const res = await indexing.urlNotifications.publish({
                    requestBody: {
                        url: url,
                        type: 'URL_UPDATED',
                    },
                });
                console.log(`Successfully pinged Google for: ${url} (Status: ${res.status})`);
            } catch (error) {
                console.error(`Failed for ${url}:`, error.message);
            }
        }
    } catch (err) {
        console.error('Authentication or API Error:', err.message);
        process.exit(1);
    }
}

sendToGoogle();
