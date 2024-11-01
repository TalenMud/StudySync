

const express = require('express');
const path = require('path');
const { GenerateRandomCode } = require('./public/main');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

const RateLimit = {};
const MaxRequests = 10;
const TimeFrame = 1800000

const CheckRateLimit = (req, res, next) => {
    const ip = req.ip;

    if(!RateLimit[ip]){
        RateLimit[ip] = {
        count: 0,
        FirstRequestTime: Date.now(),
    };
}

const CurrentTime = Date.now();
if (CurrentTime - RateLimit[ip].FirstRequestTime > TimeFrame){
    RateLimit[ip].count = 0;
    RateLimit[ip].FirstRequestTime = CurrentTime
}

if (RateLimit[ip].count >= MaxRequests) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
}

RateLimit[ip].count++;
    next();
};

app.use(express.static(path.join(__dirname, 'public')));

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to serve join.html
app.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'join.html'));
});

app.get('/generate-code', CheckRateLimit, (req, res) => {
    const code = GenerateRandomCode(); 
    if (code) {
        res.json({ code }); // Send the generated code as a JSON response
    } else {
        res.status(429).json({ error: 'Maximum code generation limit reached.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
