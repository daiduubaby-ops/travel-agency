const { init, getWrapper } = require('../db/sql');

let wrapper = null;

async function connectDB() {
  await init();
  wrapper = getWrapper();
  return Promise.resolve();
}

function getDb() {
  if (!wrapper) throw new Error('DB not initialized');
  return wrapper;
}

module.exports = connectDB;
module.exports.getDb = getDb;
