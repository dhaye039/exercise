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
        const query = `SELECT ID, TITLE, AUTHOR FROM items WHERE title LIKE ? ORDER BY title ASC LIMIT ? OFFSET ?`;
        const values = [`%${title}%`, limit, offset];

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
                   i.DESCRIPT, i.SERIES, i.ADD_AUTHOR, bs.Subject 
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
                subjects: results.map(row => row.Subject).filter(Boolean) // Collect subjects
            };

            callback(null, book);
        });
    });
};

module.exports = Item;