const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = []; // This should be an array of user objects { username, password }

// Secret key for JWT
const secretKey = 'mySuperSecretKey12345@!#%^&*'; 

// Check if username exists in the user database
const isValid = (username) => {
  return users.some(user => user.username === username);
};

// Check if the username and password match a registered user
const authenticatedUser = (username, password) => {
  return users.some(user => user.username === username && user.password === password);
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Generate a JWT token
  const accessToken = jwt.sign({ username }, secretKey, { expiresIn: '1h' });

  return res.status(200).json({ message: "Login successful", token: accessToken });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.user = user.username; // Add the username to the request object
    next();
  });
};

// Add or modify a book review
regd_users.put("/auth/review/:isbn", verifyToken, (req, res) => {
  const { isbn } = req.params;
  const { review } = req.query; // Extract review from query parameters
  const username = req.user; // This is set by the verifyToken middleware

  // Find the book by ISBN
  let book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Add or update the review
  if (!book.reviews) {
    book.reviews = {}; // Initialize reviews if they don't exist
  }
  book.reviews[username] = review;

  return res.status(200).json({ message: "Review added/updated successfully", reviews: book.reviews });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", verifyToken, (req, res) => {
    const { isbn } = req.params;
    const username = req.user; // Detta sätts av verifyToken-middleware
  
    // Hitta boken baserat på ISBN
    let book = books[isbn];
    if (!book || !book.reviews || !book.reviews[username]) {
      return res.status(404).json({ message: "Review not found" });
    }
  
    // Ta bort användarens recension
    delete book.reviews[username];
  
    return res.status(200).json({ message: "Review deleted successfully", reviews: book.reviews });
  });
  
module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
