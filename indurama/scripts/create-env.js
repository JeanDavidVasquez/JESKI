const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

const envVars = [
    'API_KEY',
    'AUTH_DOMAIN',
    'PROJECT_ID',
    'STORAGE_BUCKET',
    'MESSAGING_SENDER_ID',
    'APP_ID',
    'MEASUREMENT_ID'
];

let content = '';
envVars.forEach((key) => {
    if (process.env[key]) {
        content += `${key}=${process.env[key]}\n`;
    }
});

fs.writeFileSync(envPath, content);
console.log('.env file created successfully');
