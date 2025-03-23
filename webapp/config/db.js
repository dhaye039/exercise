
var mysql = require('mysql');

exports.pool = mysql.createPool({
    host: 'mysql1',
    user: 'root',
    password: 'mysql',
    database: 'mydb'
});
