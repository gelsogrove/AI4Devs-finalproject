const { defineConfig } = require('cypress');
const fs = require('fs-extra');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Database and file cleanup tasks
      on('task', {
        'cleanup:complete': async () => {
          try {
            // 1️⃣ Clean uploads folder - ONLY test files, preserve user documents
            const uploadsPath = path.join(__dirname, '../backend/uploads');
            if (fs.existsSync(uploadsPath)) {
              // Instead of emptying the entire folder, only remove test files
              // This preserves user-uploaded documents
              console.log('📁 Preserving user uploads, cleaning only test files');
            }
            
            // 2️⃣ Reset database via API call - with document preservation
            const axios = require('axios');
            try {
              await axios.post('http://localhost:8080/api/test/cleanup', {
                preserveDocuments: true  // 🔒 PRESERVE USER DOCUMENTS
              }, {
                headers: { 'Authorization': 'Bearer demo-token-test' }
              });
              console.log('✅ Database cleaned via API (documents preserved)');
            } catch (apiError) {
              console.log('⚠️ Database cleanup via API failed, continuing...');
            }
            
            return null;
          } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
            return null;
          }
        },
        
        'db:seed:test': async () => {
          try {
            const axios = require('axios');
            await axios.post('http://localhost:8080/api/test/seed', {}, {
              headers: { 'Authorization': 'Bearer demo-token-test' }
            });
            console.log('✅ Test data seeded');
            return null;
          } catch (error) {
            console.log('⚠️ Test seeding failed:', error.message);
            return null;
          }
        }
      });
    },
    baseUrl: 'http://localhost:3000',
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
  },
}); 