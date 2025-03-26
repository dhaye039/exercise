var express = require('express');
var router = express.Router();

var Item = require('../models/item');
var { router: authRouter, authMiddleware } = require('../routes/auth');

router.use('/', authRouter);

/**
 * Validates that the search string contains only allowed characters.
 * @param {string} input - The user input from the search field.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function isValidSearch(input) {
    // Allows letters, digits, spaces, and apostrophes.
    let regex = /^[a-zA-Z0-9' ]+$/;
    return regex.test(input);
}

// GET home page.
router.get('/', function (req, res, next) {
    res.render('index', { user: req.session.user });    
});

// GET search page.
router.get('/search', (req, res) => {
    let title = req.query.title || '';
    let startIndex = parseInt(req.query.startIndex, 10) || 0; 
    let limit = 10;

    if (!title.trim()) {
        return res.render('index', { title, results: null, totalCount: 0, error: null });
    }

    if (!isValidSearch(title)) {
        return res.render('index', { title, results: null, totalCount: 0, error: "Invalid input! Only letters, numbers, spaces, and apostrophes are allowed." });
    }

    Item.search(title, limit, startIndex, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).render('index', { title, results: null, totalCount: 0, error: "An error occurred. Please try again." });
        }

        Item.count(title, (err, totalCount) => {
            if (err) {
                console.error("Count query error:", err);
                return res.status(500).render('index', { title, results: null, totalCount: 0, error: "An error occurred. Please try again." });
            }

            let currentPage = Math.floor(startIndex / limit) + 1;
            let totalPages = Math.ceil(totalCount / limit);

            let nextIndex = startIndex + limit < totalCount ? startIndex + limit : null;
            let prevIndex = startIndex - limit >= 0 ? startIndex - limit : null;
            let hasPrev = prevIndex !== null;

            res.render('index', {
                user: req.session.user, 
                title, 
                results, 
                totalCount, 
                startIndex, 
                nextIndex, 
                prevIndex,
                hasPrev,
                currentPage,
                totalPages,
                error: null 
            });
        });
    });
});

// GET details page.
router.get('/details', (req, res) => {
    let bookId = req.query.book_id;

    if (!bookId) {
        return res.status(400).send("Invalid request: Missing book ID.");
    }

    // Fetch book details from database
    Item.getDetails(bookId, (err, book) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("An error occurred. Please try again.");
        }

        if (!book) {
            return res.status(404).send("Book not found.");
        }

        // Render details page
        res.render('details', { user: req.session.user, book });
    });
});

// Mobile search route
router.get('/mobile/search', (req, res) => {
    let title = req.query.title || '';
    let startIndex = parseInt(req.query.startIndex, 10) || 0;
    let limit = 10;

    if (!title.trim()) {
        return res.render('mobilesearch', { title, results: null, totalCount: 0, error: null });
    }

    if (!isValidSearch(title)) {
        return res.render('mobilesearch', { title, results: null, totalCount: 0, error: "Invalid input! Only letters, numbers, spaces, and apostrophes are allowed." });
    }

    Item.search(title, limit, startIndex, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).render('mobilesearch', { title, results: null, totalCount: 0, error: "An error occurred. Please try again." });
        }

        Item.count(title, (err, totalCount) => {
            if (err) {
                console.error("Count query error:", err);
                return res.status(500).render('mobilesearch', { title, results: null, totalCount: 0, error: "An error occurred. Please try again." });
            }

            let currentPage = Math.floor(startIndex / limit) + 1;
            let totalPages = Math.ceil(totalCount / limit);
            let nextIndex = startIndex + limit < totalCount ? startIndex + limit : null;
            let prevIndex = startIndex - limit >= 0 ? startIndex - limit : null;
            let hasPrev = prevIndex !== null;

            res.render('mobilelist', { 
                title, 
                results, 
                totalCount, 
                startIndex, 
                nextIndex, 
                prevIndex,
                hasPrev,
                currentPage,
                totalPages,
                error: null 
            });
        });
    });
});

// Mobile details page
router.get('/mobile/details', (req, res) => {
    let bookId = parseInt(req.query.book_id, 10);

    if (isNaN(bookId)) {
        return res.status(400).send("Invalid request: Missing or incorrect book ID.");
    }

    Item.getDetails(bookId, (err, book) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("An error occurred. Please try again.");
        }

        if (!book) {
            return res.status(404).send("Book not found.");
        }

        res.render('mobiledetails', { book });
    });
});

// maintain page
router.get('/maintain', authMiddleware, (req, res) => {
    let bookId = parseInt(req.query.book_id, 10);
    
    if (isNaN(bookId)) {
        return res.status(400).send("Invalid book ID.");
    }

    Item.getDetails(bookId, (err, book) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("An error occurred.");
        }

        if (!book) {
            return res.status(404).send("Book not found.");
        }

        res.render('maintain', { book, user: req.session.user });
    });
});

// maintain form
router.post('/maintain', authMiddleware, (req, res) => {
    let { book_id, callNo, author, title, pubInfo, descript, series, addAuthor, updateCount } = req.body;

    if (req.body.btnCancel) {
        return res.redirect(`/details?book_id=${book_id}`);
    }

    // check for required fields
    if (!callNo || !callNo.trim() || !author || !author.trim() || !title || !title.trim()) {
        return res.render('maintain', { error: "Call #, Author, and Title must be filled.", book: req.body });
    }


    // Call the Item.updateDetails function
    Item.updateDetails(book_id, callNo, author, title, pubInfo, descript, series, addAuthor, updateCount, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("An error occurred. Please try again.");
        }

        if (result && result.error) {
            return res.render('maintain', { error: result.error, book: req.body });
        }

        // Redirect to the details page if successful
        res.redirect(`/details?book_id=${book_id}`);
    });
});

module.exports = router;