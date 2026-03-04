const net = require('net');
const dns = require('dns');

// If you have a .env file, you might want to load it first
require('dotenv').config();

const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
const ports = [465, 587, 25];

console.log(`--- SMTP Diagnostics ---`);
console.log(`Target Host: ${host}`);

// 1. DNS Resolution Check
dns.lookup(host, (err, address, family) => {
    if (err) {
        console.error(`DNS @ SMTP Lookup Failed for ${host}:`, err.message);
    } else {
        console.log(`DNS @ SMTP Lookup Success: ${host} -> ${address} (IPv${family})`);
    }

    // 2. Port Connectivity Check
    ports.forEach(port => {
        const socket = new net.Socket();

        socket.setTimeout(8000); // 8 seconds timeout

        const start = Date.now();

        socket.on('connect', () => {
            console.log(`[SUCCESS] Port ${port} is reachable on ${host}. Time: ${Date.now() - start}ms`);
            socket.destroy();
        });

        socket.on('timeout', () => {
            console.error(`[TIMEOUT] Port ${port} is unreachable on ${host} (Timeout).`);
            socket.destroy();
        });

        socket.on('error', (err) => {
            console.error(`[ERROR] Port ${port} connection failed on ${host}:`, err.message);
            socket.destroy();
        });

        console.log(`Testing connectivity to ${host}:${port}...`);
        socket.connect(port, host);
    });
});
