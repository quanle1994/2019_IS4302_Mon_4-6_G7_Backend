require('dotenv').load();

var express = require('express');
var proxy = require('express-http-proxy');
var jwt = require('jsonwebtoken');

var app = new express();

app.use(express.static('static'))
app.use('hlf', proxy('localhost:3001/'))

app.listen(process.env.NODE_PORT, () => {
    console.log(`Server started on port: ${process.env.NODE_PORT}`)
});