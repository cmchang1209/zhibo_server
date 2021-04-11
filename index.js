#!/usr/bin/env node

/* golbal params */
const adminPort = 8003
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
app.use('/static', express.static(path.resolve(__dirname, '../web/admin/dist/static')))
app.use('*/static', express.static(path.resolve(__dirname, '../web/admin/dist/static')))
app.use('/favicon.ico', express.static(path.resolve(__dirname, '../web/admin/dist/favicon.ico')))

// 訪問單頁
app.get('*', function(req, res) {
    var html = fs.readFileSync(path.resolve(__dirname, '../web/admin/dist/index.html'), 'utf-8')
    res.send(html)
})

io.on('connection', function(socket) {
    console.log('A user connected')

    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function() {
        console.log('A user disconnected')
    })

    socket.on('getEquipmentList', function() {
        getEquipmentList(socket)
        setInterval(() => {
            getEquipmentList(socket)
        }, 5000)
    })

    socket.on('fcnr', function(data) {
        ioPiClient.emit('fcnr', { data: data, indexSid: socket.id })
    })

    socket.on('addRoom', function(data) {
        addRoom(socket, data)
    })

    socket.on('getRoomList', function(data) {
        getRoomList(socket)
    })

    socket.on('updateRoom', function(data) {
        updateRoom(socket, data)
    })

    socket.on('getRoomData', function(data) {
        getRoomData(socket, data)
    })

    socket.on('getChanelData', function(data) {
        getChanelData(socket, data)
    })
})

http.listen(adminPort, function() {
    console.log('listening on *:8003')
})

/* 與 server pi.js 通訊 */
const awsHost = 'videostream.fidodarts.com'
const serverPiPort = 8004
const url = `http://${awsHost}:${serverPiPort}`
const ioPi = require('socket.io-client')
const ioPiClient = ioPi.connect(url)

ioPiClient.on('connect', () => {
    console.log('connect')
})

ioPiClient.on("fcnrEcho", (data) => {
    for (const [sid, client] of io.sockets.sockets.entries()) {
        if (sid === data.indexSid) {
            client.emit('fcnrEcho', data.status)
        }
    }
})

ioPiClient.on("disconnect", () => {
    console.log('disconnect')
})



async function getEquipmentList(socket) {
    let sql = `SELECT pi.id, pi.no, pi.mac, pi.name, cam.content AS children FROM iteam_connect_pi AS cpi LEFT JOIN iteam_pi AS pi ON cpi.pi_id=pi.id LEFT JOIN iteam_connect_cam as cam ON cpi.pi_id=cam.pi_id WHERE cpi.status=1`
    let data = await query(sql)
    if (data) {
        socket.emit('EquipmentData', data)
    }
}

async function addRoom(socket, d) {
    let no = await genID(3)
    let sql = `INSERT INTO iteam_room (no, name, type) VALUES ('${no}', '${d.name}', ${d.type})`
    let data = await query(sql)
    if (data) {
        socket.emit('echoAddRoom', data)
    }
}

async function getRoomList(socket) {
    let sql = `SELECT * FROM iteam_room`
    let data = await query(sql)
    if (data) {
        socket.emit('roomList', data)
    }
}

async function updateRoom(socket, d) {
    let sql = `UPDATE iteam_room SET name='${d.name}', type=${d.type} WHERE id=${d.id}`
    let data = await query(sql)
    if (data) {
        socket.emit('echoUpdateRoom', data)
    }
}

async function getRoomData(socket, d) {
    let sql = `SELECT * FROM iteam_room WHERE no='${d.no}'`
    let data = await query(sql)
    if (data) {
        socket.emit('roomData', data)
    }
}

async function getChanelData(socket, d) {
    let sql = `SELECT * FROM iteam_chanel WHERE room_id=${d.id} AND chanel=${d.chanel}`
    let data = await query(sql)
    if (data) {
        socket.emit('chanelData', { me: d, data: data })
    }
}

async function genID(length) {
    return Number(Math.random().toString().substr(3, length) + Date.now()).toString(36);
}