var express = require('express');
var router = express.Router();

var Item = require('../models/item');

// validates if the card number and password are valid credentials
router.post('/validateCard', (req, res) => {
    var { cardNumber, password } = req.body;
    if (!cardNumber) return res.status(400).json({ error: 'Card number and password are required.' });

    Item.login(cardNumber, password, (err, isValid) => {
        if (err) return res.status(500).json({ success: false, error: 'Database error' });
        if (!isValid) return res.json({ error: 'Invalid card or password number.' });
        else {
            req.session.cardNumber = cardNumber;
            res.json({ success: isValid });
        }
    });
});

// retrieves item info (title, author, and status).
// grabs the most recent element.
router.get('/itemInfo', isLoggedIn, (req, res) => {
    var itemId = req.query.itemId;
    Item.getItemInfo(itemId, (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!result) return res.status(404).json({ error: 'Item not found' });
        res.json({
            title: result.TITLE,
            author: result.AUTHOR,
            status: result.Status
        });
    });
});

router.post('/checkoutItems', isLoggedIn, (req, res) => {
    var { cardNumber, itemIds } = req.body;
    Item.checkoutItems(cardNumber, itemIds, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: 'Checkout failed' });
        res.json(result);
    });
});

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
    var cardNumber = req.session.cardNumber;
    if (cardNumber) {
        next();
    } else {
        res.redirect("/");
    }
}

// Clears the session ID after logging out
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        } else {
            res.clearCookie('connect.sid');
            res.json({ success: true });
        }
    });
});

module.exports = router;
