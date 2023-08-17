import sqlite3 from 'sqlite3';

// Open the SQLite database
let db = new sqlite3.Database('./api-responses.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});

// Create the table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS responses (
  url TEXT PRIMARY KEY,
  name TEXT,
  response TEXT,
  timestamp TEXT
)`, (err) => {
  if (err) {
    console.error(err.message);
  }
});

export const saveData = (url, visualizationName, data) => {
  let stmt = db.prepare(`INSERT OR REPLACE INTO responses (url, name, response, timestamp) VALUES (?, ?, ?, ?)`);
  stmt.run(url, visualizationName, JSON.stringify(data), new Date().toISOString());
  stmt.finalize();
};

export const getData = (url) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM responses WHERE url = ?`, [url], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? JSON.parse(row.response) : null);
      }
    });
  });
};

export const clearDb = () => {
  db.run(`DELETE FROM responses`, (err) => {
    if (err) {
      console.error(err.message);
    }
  });
};

// Close the database connection when the Node.js process is about to exit.
process.on('exit', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Close the database connection.');
  });
});
