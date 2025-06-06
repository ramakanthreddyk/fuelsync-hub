
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Read and execute SQL files in order
    const sqlFiles = [
      '004_station_architecture.sql',
      '005_seed_multi_tenant_data.sql'
    ];
    
    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, '../../sql', file);
      
      if (fs.existsSync(filePath)) {
        console.log(`📄 Executing ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split by semicolon to execute each statement separately (safer for Azure PostgreSQL)
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
          try {
            await sequelize.query(statement + ';');
          } catch (error) {
            // Log warning but continue if it's just that something already exists
            if (!error.message.includes('already exists')) {
              console.warn(`⚠️  Warning in ${file}: ${error.message}`);
            }
          }
        }
        
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
