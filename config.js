const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

function readConfig() {
  return {
    studentName: process.env.STUDENT_NAME || 'RHOIDAH N LITAPELO',
    studentNumber: process.env.STUDENT_NUMBER || '202503013',
    projectName: process.env.PROJECT_NAME || 'IT Support Desk',
    apiBaseUrl: process.env.API_BASE_URL || process.env.RENDER_EXTERNAL_URL || '',
    clientOrigins: (process.env.CLIENT_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean),
  };
}

module.exports = { readConfig };
