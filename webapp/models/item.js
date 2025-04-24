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

// validates if the card number and password are valid credentials
Item.login = function (cardNum, password, callback) {
    db.pool.getConnection((err, connection) => {
        if (err) return callback(err);
        connection.query('SELECT * FROM patron WHERE CardNum = ?', [cardNum], (err, results) => {
            connection.release();
            if (err) return callback(err);
            if (results.length === 0) return callback(null, false);
            var patron = results[0];
            var isValid = patron.Phone === password;
            callback(null, isValid);
        });
    });
};

// retrieves item info (title, author, and status).
// grabs the most recent element.
Item.getItemInfo = function (itemId, callback) {
    var query = `
        SELECT i.TITLE, i.AUTHOR, s.Status
        FROM items i
        JOIN itemstatus s ON i.ID = s.ItemID
        WHERE i.ID = ?
        ORDER BY s.TimeChange DESC
        LIMIT 1
    `;
    db.pool.getConnection((err, connection) => {
        if (err) return callback(err);
        connection.query(query, [itemId], (err, results) => {
            connection.release();
            if (err) return callback(err);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    });
};

// inserts a new entry to the table with the items that were in the
// basket and changes their status to 'C'
Item.checkoutItems = function (cardNumber, itemIds, callback) {
    if (!Array.isArray(itemIds) || itemIds.length === 0 || itemIds.length > 3) {
        return callback(null, { success: false, error: 'Must checkout 1-3 items' });
    }

    db.pool.getConnection((err, connection) => {
        if (err) return callback(err);

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return callback(err);
            }
        });

        connection.query('SELECT * FROM patron WHERE CardNum = ?', [cardNumber], (err, patrons) => {
            if (err || patrons.length === 0) {
                connection.release();
                return callback(null, { success: false, error: 'Invalid patron ID' });
            }

            var placeholders = itemIds.map(() => '?').join(',');
            var statusQuery = `
                SELECT s.ItemID, s.Status
                FROM itemstatus s
                WHERE s.ItemID IN (${placeholders})
                AND s.TimeChange = (
                    SELECT MAX(TimeChange)
                    FROM itemstatus
                    WHERE ItemID = s.ItemID
                )
            `;

            connection.query(statusQuery, itemIds, (err, statuses) => {
                if (err) {
                    connection.release();
                    return callback(err);
                }

                var unavailable = statuses.filter(s => s.Status !== 'S');
                if (unavailable.length > 0) {
                    connection.release();
                    return callback(null, { success: false, error: 'One or more items are not available' });
                }

                var now = new Date();
                var dueDate = new Date(now);
                dueDate.setDate(now.getDate() + 14);
                var values = itemIds.map(id => [id, now, 'C', cardNumber, dueDate]);

                var insertQuery = 'INSERT INTO itemstatus (ItemID, TimeChange, Status, PatronID, DueDate) VALUES ?';

                connection.query(insertQuery, [values], (err) => {
                    connection.release();
                    if (err) return callback(err);
                    callback(null, { success: true });
                });
            });
        });
    });
};

module.exports = Item;