require('dotenv').config();

const express = require('express');
const cors = require('cors');
const dns = require('dns');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

// Parse form data from POST requests
app.use(express.urlencoded({ extended: false }));

// Temporary storage for shortened URLs
const urls = [];

// Home page
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Create a short URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;

  let parsedUrl;

  // Check if the URL is valid
  try {
    parsedUrl = new URL(originalUrl);
  } catch (err) {
    return res.json({
      error: 'invalid url'
    });
  }

  // Only allow http:// and https://
  if (
    parsedUrl.protocol !== 'http:' &&
    parsedUrl.protocol !== 'https:'
  ) {
    return res.json({
      error: 'invalid url'
    });
  }

  // Check if the hostname actually exists
  dns.lookup(parsedUrl.hostname, function(err) {
    if (err) {
      return res.json({
        error: 'invalid url'
      });
    }

    // Check if URL was already shortened
    const existingUrl = urls.find(function(item) {
      return item.original_url === originalUrl;
    });

    if (existingUrl) {
      return res.json(existingUrl);
    }

    // Create new short URL
    const newUrl = {
      original_url: originalUrl,
      short_url: urls.length + 1
    };

    urls.push(newUrl);

    res.json(newUrl);
  });
});

// Redirect short URL to original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = Number(req.params.short_url);

  const foundUrl = urls.find(function(item) {
    return item.short_url === shortUrl;
  });

  if (!foundUrl) {
    return res.json({
      error: 'No short URL found'
    });
  }

  res.redirect(foundUrl.original_url);
});

// Start server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});