'use strict';

var db = require('../config/db');

function Item(id, callNo, author, title, pubInfo, descript, series, addAuthor, updateCount) {
    this.id = id;
    this.callNo = callNo;
    this.author = author;
    this.title = title;
    this.pubInfo = pubInfo;
    this.descript = descript;
    this.series = series;
    this.addAuthor = addAuthor;
    this.updateCount = updateCount;
}

Item.search = function (title, limit, offset, callback) {
    db.pool.getConnection(function (err, connection) {
        if (err) return callback(err);

        // Select only `title` and `author`, sorted by `title`
        let query = `SELECT ID, TITLE, AUTHOR FROM items WHERE title LIKE ? ORDER BY title ASC LIMIT ? OFFSET ?`;
        let values = [`%${title}%`, limit, offset];

        connection.query(query, values, function (err, data) {
            connection.release();
            if (err) return callback(err);

            if (data) {
                var results = data.map(item => ({
                    id: item.ID,
                    title: item.TITLE,
                    author: item.AUTHOR
                }));
                callback(null, results);
            } else {
                callback(null, []);
            }
        });
    });
};

Item.count = function (title, callback) {
    db.pool.getConnection(function (err, connection) {
        if (err) return callback(err);

        let countQuery = `SELECT COUNT(*) AS count FROM items WHERE title LIKE ?`;
        connection.query(countQuery, [`%${title}%`], function (err, result) {
            connection.release();
            if (err) return callback(err);
            callback(null, result[0].count);
        });
    });
};

Item.getDetails = function (bookId, callback) {
    db.pool.getConnection((err, connection) => {
        if (err) return callback(err);

        // Query to get book details and subject categories
        const query = `
            SELECT i.ID, i.CALLNO, i.AUTHOR, i.TITLE, i.PUB_INFO, 
                   i.DESCRIPT, i.SERIES, i.ADD_AUTHOR, i.UPDATE_COUNT, bs.Subject 
            FROM items i
            LEFT JOIN booksubjects bs ON i.ID = bs.BookID
            WHERE i.ID = ?`;

        connection.query(query, [bookId], (err, results) => {
            connection.release();
            if (err) return callback(err);
            if (results.length === 0) return callback(null, null);

            // Format book details
            const book = {
                id: results[0].ID,
                callNo: results[0].CALLNO,
                author: results[0].AUTHOR,
                title: results[0].TITLE,
                pubInfo: results[0].PUB_INFO,
                descript: results[0].DESCRIPT,
                series: results[0].SERIES,
                addAuthor: results[0].ADD_AUTHOR,
                updateCount: results[0].UPDATE_COUNT,
                subjects: results.map(row => row.Subject).filter(Boolean) // Collect subjects
            };

            callback(null, book);
        });
    });
};

Item.login = function (username, password) {
    db.pool.getConnection((err, connection) => {
        if (err) return res.status(500).send(`Database error (item.js 93): ${err}`);

        connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            connection.release();
            if (err) return res.status(500).send(`Database error (item.js 97): ${err}`);

            if (results.length === 0) {
                return res.render('login', { error: "Invalid username or password" });
            }

            let user = results[0];

            // Compare password with the stored hashed password
            let match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.render('login', { error: "Invalid username or password" });
            }

            // Store user session
            req.session.user = { id: user.ID, username: user.username };

            res.redirect('/');
        });
    });
}

/**
 * Retrieve a user by username.
 * @param {string} username
 * @param {function} callback
 */
Item.getUser = function (username, callback) {
    db.pool.getConnection(function (err, connection) {
        if (err) return callback(err);

        let query = 'SELECT * FROM users WHERE username = ?';
        connection.query(query, [username], function (err, results) {
            connection.release();
            if (err) return callback(err);
            callback(null, results);
        });
    });
};

Item.updateDetails = function (book_id, callNo, author, title, pubInfo, descript, series, addAuthor, updateCount, callback) {
    db.pool.getConnection((err, connection) => {
        if (err) return callback(err);

        // Check if the record has been updated by another user
        connection.query(`SELECT UPDATE_COUNT FROM items WHERE ID = ?`, [book_id], (err, results) => {

            if (err) {
                connection.release();
                return callback(err);
            }

            if (results[0].UPDATE_COUNT !== parseInt(updateCount)) {
                connection.release();
                return callback(null, { error: "This record has been updated by another user. Please refresh." });
            }

            // Update the book record
            connection.query(
                `UPDATE items SET CALLNO = ?, AUTHOR = ?, TITLE = ?, PUB_INFO = ?, 
                 DESCRIPT = ?, SERIES = ?, ADD_AUTHOR = ?, UPDATE_COUNT = UPDATE_COUNT + 1 
                 WHERE ID = ?`,
                [callNo, author, title, pubInfo, descript, series, addAuthor, book_id],
                (err) => {
                    connection.release();
                    if (err) return callback(err);

                    callback(null, { success: true });
                }
            );
        });
    });
};

module.exports = Item;