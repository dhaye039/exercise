var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

var Item = require('../models/item');

// Login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Login form submission
router.post('/login', (req, res) => {
    let { username, password } = req.body;

    // Use Item.getUser to get the user
    Item.getUser(username, (err, results) => {
        if (err) return res.status(500).send(`Database error: ${err}`);
        if (!results || results.length === 0) {  // Check if user was found
            return res.render('login', { error: "Invalid username or password" });
        }

        let user = results[0];

        if (!user || !user.Password) {  // Ensure user and password exist
            return res.render('login', { error: "Invalid username or password" });
        }

        // Compare password with the stored hashed password
        bcrypt.compare(password, user.Password, function (err, match) {
            if (err) return res.status(500).send(`Database error: ${err}`);
            if (!match) {
                return res.render('login', { error: "Invalid username or password" });
            }

            // Store user session
            req.session.user = { id: user.ID, username: user.Username };
            res.redirect('/');
        });
    });
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Middleware
function authMiddleware(req, res, next) {
    if (!req.session.user) {
        return res.status(403).send("Unauthorized: Please log in first.");
    }
    next();
}

module.exports = { router, authMiddleware };
