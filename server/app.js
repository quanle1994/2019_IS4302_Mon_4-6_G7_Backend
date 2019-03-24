require('dotenv').load();

const express = require('express');
const proxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const rand = require("randomstring");
const app = new express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(req);
        cb(null, process.env.PHOTO_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, `${rand.generate(10)}${file.originalname}`)
    }
});
const upload = multer({
    storage: storage,
});
app.use(express.static('static'));
app.use('hlf', proxy('localhost:3001/'));
app.use('alf', proxy('localhost:3002/'));
app.use('blf', proxy('localhost:3003/'));
app.use('clf', proxy('localhost:3004/'));

app.get('/getPhoto', (req, res) => {
    res.sendFile(process.env.PHOTO_DIR + '/test.jpg');
});

app.get('/savePhoto', upload.single('photo'), (req, res) => {
    console.log(req.file);
    res.status(200).send();
});

app.listen(process.env.NODE_PORT, () => {
    console.log(`Server started on port: ${process.env.NODE_PORT}`)
});