
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Read and execute SQL files in order
    const sqlFiles = [
      '001_initial_schema.sql',
      '002_seed_data.sql',
      '003_views_and_functions.sql'
    ];
    
    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, '../../sql', file);
      
      if (fs.existsSync(filePath)) {
        console.log(`📄 Executing ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        await sequelize.query(sql);
        console.log(`✅ ${file} executed successfully`);
      } else {
        console.log(`⚠️  ${file} not found, skipping...`);
      }
    }
    
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
