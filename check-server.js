#!/usr/bin/env node

const http = require('http');
const https = require('https');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:7029';
const HEALTH_ENDPOINT = '/health';

function checkServer(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({
            status: 'online',
            statusCode: res.statusCode,
            data: data
          });
        } else {
          resolve({
            status: 'error',
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject({
        status: 'offline',
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject({
        status: 'timeout',
        error: 'Request timeout after 5 seconds'
      });
    });
  });
}

async function main() {
  console.log('🔍 Checking server status...');
  console.log(`📍 Server URL: ${SERVER_URL}`);
  console.log(`🏥 Health endpoint: ${SERVER_URL}${HEALTH_ENDPOINT}`);
  console.log('');
  
  try {
    const result = await checkServer(`${SERVER_URL}${HEALTH_ENDPOINT}`);
    
    if (result.status === 'online') {
      console.log('✅ Server is ONLINE');
      console.log(`📊 Status Code: ${result.statusCode}`);
      console.log(`📄 Response: ${result.data}`);
    } else {
      console.log('⚠️  Server responded with error');
      console.log(`📊 Status Code: ${result.statusCode}`);
      console.log(`📄 Response: ${result.data}`);
    }
  } catch (error) {
    console.log('❌ Server is OFFLINE');
    console.log(`🚨 Error: ${error.error}`);
    
    if (error.status === 'timeout') {
      console.log('');
      console.log('💡 Troubleshooting tips:');
      console.log('1. Check if the backend server is running');
      console.log('2. Verify the server URL is correct');
      console.log('3. Check if port 7029 is accessible');
      console.log('4. Try restarting the backend server');
    }
  }
  
  console.log('');
  console.log('🔧 To check a different server, set the SERVER_URL environment variable:');
  console.log('   SERVER_URL=http://your-server:port node check-server.js');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkServer }; 