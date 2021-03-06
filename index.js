/*
* Primary file for the API
*
*/
// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {
  // Get the URL and parse it
  unifiedServer(req, res);
});
// Start the server, and have it listen on port 3000
httpServer.listen(config.httpPort, () => {
  console.log(`The server is listening on port ${config.httpPort}`)
});
// Instantiate the HTTPS server
const httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
})
// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`The server is listening on port ${config.httpsPort}`)
});

// All teh server logic for both the http adn https server
const unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  // Get the path from that URL
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  // Get the query string as an object
  const queryStringObject = parsedUrl.query;
  // Get the HTTP method
  const method = req.method.toLowerCase();
  // Get the Headers as an object
  const headers = req.headers;
  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();
    // Choose the handlers this request should go to. If one is not found, use the notFound handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': buffer
    }

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode = 200, payload = {}) => {

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the requested path
      console.log('Returning this response:', statusCode, payloadString);
    });
  });
}

// Define the handlers
const handlers = {};

// Ping handler (to let know that server is still alive)
handlers.ping = (data, callback) => {
  callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Define a request router
const router = {
  'ping': handlers.ping
};