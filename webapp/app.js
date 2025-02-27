let express = require('express');
let mysql = require('mysql');
let app = express();
let port = process.env.PORT || 3000;

// Use built-in middleware for urlencoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create a connection pool to MySQL (update credentials as needed)
let pool = mysql.createPool({
  connectionLimit: 10,
  host: 'mysql1',
  user: 'mysql',
  password: 'mysql',
  database: 'mydb'
});

// POST /registrations endpoint
app.post('/registrations', (req, res) => {
  let { firstName, lastName, grade, email, shirtSize, hrUsername } = req.body;

  // Basic validation
  if (!firstName || !lastName || !grade || !email || !shirtSize || !hrUsername) {
    return res.status(400).send('All fields are required.\n');
  }
  if (!['S', 'M', 'L'].includes(shirtSize)) {
    return res.status(400).send('shirtSize must be S, M, or L.\n');
  }
  if (!['9', '10', '11', '12'].includes(String(grade))) {
    return res.status(400).send('grade must be 9, 10, 11, or 12.\n');
  }

  // Prepare the INSERT statement
  let sql = 'INSERT INTO registrations (firstName, lastName, grade, email, shirtSize, hrUsername) VALUES (?, ?, ?, ?, ?, ?)';
  let values = [firstName, lastName, grade, email, shirtSize, hrUsername];

  // Insert the record into the database
  pool.query(sql, values, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error: ' + err.message + '\n');
    }
    res.status(200).send('Registration successful.\n');
  });
});

// GET /registrations endpoint
app.get('/registrations', (req, res) => {
  let sql = 'SELECT * FROM registrations';
  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error: ' + err.message + '\n');
    }
    res.json(results);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
