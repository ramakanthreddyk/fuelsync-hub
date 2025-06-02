
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up FuelSync database...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Drop all tables if they exist (fresh start)
    console.log('🗑️  Dropping existing tables...');
    await sequelize.drop({ cascade: true });
    
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
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
          try {
            await sequelize.query(statement + ';');
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.warn(`⚠️  Warning in ${file}:`, error.message);
            }
          }
        }
        
        console.log(`✅ ${file} executed successfully`);
      } else {
        console.log(`⚠️  ${file} not found, skipping...`);
      }
    }
    
    // Verify setup by checking if admin user exists
    const [results] = await sequelize.query("SELECT email, role FROM users WHERE email = 'admin@fuelsync.com'");
    
    if (results.length > 0) {
      console.log('✅ Database setup completed successfully!');
      console.log('🔑 Demo credentials:');
      console.log('   Admin: admin@fuelsync.com / admin123');
      console.log('   Owner: owner@fuelsync.com / owner123');
      console.log('   Employee: employee@fuelsync.com / employee123');
      console.log('   Manager: manager@fuelsync.com / manager123');
    } else {
      console.log('⚠️  Setup completed but admin user not found');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();
