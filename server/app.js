import {userRouter} from "./routers/userRoutes";
import bodyParser from 'body-parser';
import {adminRouter} from "./routers/adminRoutes";
import {listingRouter} from "./routers/listingRoutes";

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
app.use(bodyParser.json());
// app.use('/hlf', proxy('http://172.31.65.194:3001/'));
// app.use('/hlf', proxy('http://172.25.105.221:3001/'));
// app.use('/hlf', proxy('http://172.25.101.84:3001/'));
// app.use('/hlf', proxy('http://25.56.89.13:3001/'));

app.use('/hlf', proxy('http://25.72.144.150:3002/'));
// app.use('/hlf', proxy('http://172.25.106.32:3002/'));

// app.use('/hlf', proxy('http://localhost:3001/'));
app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/listings', listingRouter);
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