#!/usr/bin/env node

/* golbal params */
const viewPort = 8005
/* require components */
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, {
    cors: { origin: '*' }
})

const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')

/* batabase params */
const { query } = require('./async-db')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// 訪問靜態資源
app.use('/static', express.static(path.resolve(__dirname, '../web/view/dist/static')))
app.use('/favicon.ico', express.static(path.resolve(__dirname, '../web/view/dist/favicon.ico')))

// 訪問單頁
app.get('*', function(req, res) {
    var html = fs.readFileSync(path.resolve(__dirname, '../web/view/dist/index.html'), 'utf-8')
    res.send(html)
})

io.on('connection', function(socket) {
    console.log('view user connected')

    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function() {
        console.log('view user disconnected')
    })
})

http.listen(viewPort, function() {
    console.log(`listening on *:${viewPort}`)
})