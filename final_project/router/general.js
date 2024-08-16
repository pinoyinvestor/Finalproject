const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Importera Axios
let books = require("./booksdb.js");
let { isValid, users } = require("./auth_users.js");
const public_users = express.Router();

const secretKey = 'G6t@u!Q8wV1&ZzN$@bL2d6E*3mB^6YfR'; // Din hemliga nyckel för JWT

// Bas-URL för Axios (uppdatera denna URL om det behövs)
const apiUrl = 'https://danielhedenb-5000.theianext-1-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai/'; // Ändra detta till din aktuella API-endpoint

// Middleware för att autentisera JWT-tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Registrera en ny användare
public_users.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (isValid(username)) {
        return res.status(400).json({ message: "Username already exists" });
    }

    // Registrera den nya användaren
    users.push({ username, password });
    return res.status(201).json({ message: "User registered successfully" });
});

// Hämta boklistan som finns tillgänglig i butiken
public_users.get('/', async (req, res) => {
    try {
        return res.status(200).json(books);
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Hämta bokdetaljer baserat på ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
    const { isbn } = req.params;
    const book = books[isbn];

    if (book) {
        return res.status(200).json(book);
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
});

// Hämta bokdetaljer baserat på författare
public_users.get('/author/:author', async (req, res) => {
    const { author } = req.params;
    const booksByAuthor = Object.values(books).filter(book => book.author.toLowerCase() === author.toLowerCase());

    if (booksByAuthor.length > 0) {
        return res.status(200).json(booksByAuthor);
    } else {
        return res.status(404).json({ message: "No books found for this author" });
    }
});

// Hämta bokdetaljer baserat på titel
public_users.get('/title/:title', async (req, res) => {
    const { title } = req.params;
    const booksByTitle = Object.values(books).filter(book => book.title.toLowerCase() === title.toLowerCase());

    if (booksByTitle.length > 0) {
        return res.status(200).json(booksByTitle);
    } else {
        return res.status(404).json({ message: "No books found with this title" });
    }
});

// Hämta bokrecensioner baserat på ISBN
public_users.get('/review/:isbn', async (req, res) => {
    const { isbn } = req.params;
    const book = books[isbn];

    if (book && book.reviews) {
        return res.status(200).json(book.reviews);
    } else {
        return res.status(404).json({ message: "Reviews not found for this book" });
    }
});

// Lägg till eller uppdatera en bokrecension
public_users.post('/review/:isbn', authenticateToken, async (req, res) => {
    const { isbn } = req.params;
    const { review } = req.body;
    const username = req.user.username; // Hämta användarnamnet från token

    if (!isbn || !review) {
        return res.status(400).json({ message: 'ISBN and review are required' });
    }

    const book = books[isbn];
    if (book) {
        book.reviews = book.reviews || {}; // Initiera recensioner om de inte finns
        book.reviews[username] = review; // Lägg till eller uppdatera recension för boken
        return res.status(200).json({ message: 'Review added/updated successfully' });
    } else {
        return res.status(404).json({ message: 'Book not found' });
    }
});


public_users.get('/title/axios/:title', async (req, res) => {
    const { title } = req.params;

    try {
        const response = await axios.get(`${apiUrl}/books?title=${encodeURIComponent(title)}`); // Gör en GET-förfrågan med Axios
        return res.status(200).json(response.data);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch books by title' });
    }
});

module.exports.general = public_users;
