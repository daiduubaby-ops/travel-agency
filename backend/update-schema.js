// Script to update the database schema by adding description and features columns to programs table
const { init, getWrapper } = require('./db/sql');

async function updateSchema() {
  try {
    await init();
    const db = getWrapper();
    
    console.log('Checking if columns already exist...');
    const tableInfo = db.prepare("PRAGMA table_info(programs)").all();
    const columnNames = tableInfo.map(col => col.name || '');
    
    if (!columnNames.includes('description')) {
      console.log('Adding description column to programs table...');
      db.prepare("ALTER TABLE programs ADD COLUMN description TEXT").run();
      console.log('Added description column successfully');
    } else {
      console.log('description column already exists');
    }
    
    if (!columnNames.includes('features')) {
      console.log('Adding features column to programs table...');
      db.prepare("ALTER TABLE programs ADD COLUMN features TEXT").run();
      console.log('Added features column successfully');
    } else {
      console.log('features column already exists');
    }
    
    console.log('Schema update completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error updating schema:', err);
    process.exit(1);
  }
}

updateSchema();