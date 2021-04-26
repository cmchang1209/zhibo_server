#!/usr/bin/env node

/* golbal params */
const adminPort = 8003
const FFmpegWsd = 'fidodarts'
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
const exec = require('child_process').exec

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

    socket.on('updateEquipmentName', function(data) {
        updateEquipmentName(socket, data)
    })

    socket.on('fcnr', function(data) {
        data.indexSid = socket.id
        ioPiClient.emit('fcnr', data)
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

    socket.on('addChanelImage', function(data) {
        addChanelImage(socket, data)
    })

    socket.on('deleteImage', function(data) {
        deleteImage(socket, data)
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

/* 與 server view.js 通訊 */
const serverViewPort = 8006
const viewUrl = `http://${awsHost}:${serverViewPort}`
const ioView = require('socket.io-client')
const ioViewClient = ioView.connect(viewUrl)

ioViewClient.on('connect', () => {
    console.log('index connect view')
})

ioViewClient.on("disconnect", () => {
    console.log('index disconnect view')
})



async function getEquipmentList(socket) {
    let sql = `SELECT pi.id AS id, pi.no, pi.mac, pi.name, cpi.status AS status, p_used.usb_id, p_used.dev_name, p_used.type FROM iteam_pi AS pi LEFT JOIN iteam_connect_pi AS cpi ON cpi.pi_id=pi.id LEFT JOIN iteam_port_used AS p_used ON p_used.pi_id=pi.id ORDER BY pi.id ASC, p_used.usb_id ASC`
    let data = await query(sql)
    if (data) {
        var list = []
        data.map(iteam => {
            var l = list.find(liteam => {
                return liteam.id === iteam.id
            })
            var cam = {}
            cam.id = `cam-${iteam.usb_id}`
            cam.mac = '-'
            if (iteam.dev_name) {
                if (iteam.type === 1) {
                    cam.no = `Port-${iteam.usb_id}-Screen`
                } else if (iteam.type === 2) {
                    cam.no = `Port-${iteam.usb_id}-Cam`
                }
            } else {
                cam.no = `Port-${iteam.usb_id}-Unused`
            }
            cam.usb_id = iteam.usb_id
            cam.name = iteam.dev_name ? iteam.dev_name : '-'
            cam.type = iteam.type
            if (!l) {
                var pi = {}
                pi.parent = true
                pi.id = iteam.id
                pi.no = iteam.no
                pi.mac = iteam.mac
                pi.name = iteam.name
                pi.status = iteam.status
                pi.children = []
                if (iteam.status) {
                    pi.children.push(cam)
                } else {
                    /* null -> 0*/
                    pi.status = 0
                }
                list.push(pi)
            } else {
                if (iteam.status) {
                    l.children.push(cam)
                }
            }
        })
        socket.emit('EquipmentData', list)
    } else {
        console.log(`function getEquipmentList sql query error`)
    }
}

async function updateEquipmentName(socket, d) {
    let sql = `UPDATE iteam_pi SET name='${d.name}' WHERE id=${d.id}`
    let data = await query(sql)
    if (data) {
        d.data = data
        socket.emit('updateEquipmentNameEcho', d)
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
    let sql = `UPDATE iteam_room SET name='${d.name}', type=${d.style} WHERE id=${d.id}`
    let data = await query(sql)
    if (data) {
        d.data = data
        socket.emit('updateRoomEcho', d)
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
    let sql = `SELECT chanel.status, chanel.usb_id, pi.name FROM iteam_chanel AS chanel LEFT JOIN iteam_pi AS pi ON chanel.pi_id=pi.id  WHERE room_id=${d.id} AND chanel=${d.chanel}`
    let data = await query(sql)
    if (data) {
        socket.emit('chanelData', { me: d, data: data })
    }
}

async function addChanelImage(socket, d) {
    let sql = `INSERT INTO iteam_chanel (room_id, chanel, pi_id, usb_id) VALUES (${d.roomId}, ${d.chanel}, ${d.equipment}, ${d.source})`
    let data = await query(sql)
    if (data) {
        d.data = data
        socket.emit('echoAddChanelImage', d)
        sql = `SELECT p_used.port_no, p_used.dev_name, cpi.status FROM iteam_port_used AS p_used LEFT JOIN iteam_connect_pi AS cpi ON cpi.pi_id=p_used.pi_id WHERE p_used.pi_id=${d.equipment} AND p_used.usb_id=${d.source}`
        data = await query(sql)
        if (data) {
            d.data = data
            d.status = 1
            ioViewClient.emit('changeChanelStatus', d)
        }
    }
}

async function deleteImage(socket, d) {
    let sql = `DELETE FROM iteam_chanel WHERE room_id=${d.roomId} AND chanel=${d.chanel}`
    let data = await query(sql)
    if (data) {
        d.data = data
        socket.emit('echoDeleteImage', d)
        d.status = 2
        ioViewClient.emit('changeChanelStatus', d)
    }
}

async function genID(length) {
    return Number(Math.random().toString().substr(3, length) + Date.now()).toString(36);
}