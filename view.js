#!/usr/bin/env node

/* golbal params */
const viewPort = 8005
const serverIndexPort = 8006
/* require components */
const express = require('express')
const app = express()
const http = require('http').Server(app)
const { Server } = require("socket.io")
const io = new Server(http, {
    cors: { origin: '*' }
})
const indexServer = new Server(serverIndexPort)

const exec = require('child_process').exec

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

/* 初始化系統 */
init()

async function init() {
    let data = await initTempTable()
    if (data) {
        io.on('connection', function(socket) {
            console.log('view user connected')
            //Whenever someone disconnects this piece of code executed
            socket.on('disconnect', function() {
                console.log(`view user disconnected ${socket.id}`)
                removeView(socket)
            })

            socket.on('getRoomData', function(data) {
                getRoomData(socket, data)
            })

            socket.on('getChanelInfo', function(data) {
                getChanelInfo(socket, data)
            })

            socket.on('changeChanelStatus', function(data) {
                changeChanelStatus(socket, data)
            })
        })

        http.listen(viewPort, function() {
            console.log(`listening on *:${viewPort}`)
        })
    }
}

indexServer.on("connection", (socket) => {
    console.info(`indexClient connected [id=${socket.id}]`)
    socket.on('changeChanelStatus', function(data) {
        changeChanelStatus(data)
    })
    /*socket.on('deleteImage', function(data) {
        deleteImage(data)
    })*/
    socket.on("disconnect", () => {
        console.info(`indexClient gone [id=${socket.id}]`)
    })
})

async function initTempTable() {
    let sql = `TRUNCATE TABLE iteam_connect_view`
    let data = await query(sql)
    return data
}

async function getRoomData(socket, d) {
    let sql =`SELECT room.id, room.type, u.port_no,u.port_name, u.type AS imageType FROM iteam_room as room LEFT JOIN iteam_chanel AS cl ON cl.room_id=room.id LEFT JOIN iteam_port_used AS u ON (cl.pi_id=u.pi_id AND cl.usb_id=u.usb_id) WHERE room.no='${d.no}'`
    let data = await query(sql)
    if (data) {
        let sql = `INSERT INTO iteam_connect_view (room_id, sid) VALUES (${data[0].id}, '${socket.id}')`
        await query(sql)
        socket.emit('roomData', data)
    }
}

async function getChanelInfo(socket, d) {
    let sql = `SELECT cpi.status, p_used.port_no, p_used.dev_name, p_used.type FROM iteam_chanel AS chanel LEFT JOIN iteam_connect_pi AS cpi ON chanel.pi_id=cpi.pi_id LEFT JOIN iteam_port_used AS p_used ON (chanel.pi_id=p_used.pi_id AND chanel.usb_id=p_used.usb_id) WHERE chanel.room_id=${d.roomId} AND chanel.chanel=${d.chanel}`
    let data = await query(sql)
    if (data) {
        d.data = data
        socket.emit('chanelInfo', d)
    }
}

async function changeChanelStatus(d) {
    let sql = `SELECT sid FROM iteam_connect_view WHERE room_id=${d.roomId}`
    let data = await query(sql)
    if (data) {
        for (const [sid, client] of io.sockets.sockets.entries()) {
            data.map(iteam => {
                if (sid === iteam.sid) {
                    client.emit('changeChanelStatus', d)
                }
            })
        }
    }
}

/*async function deleteImage(d) {
    let sql = `SELECT sid FROM iteam_connect_view WHERE room_id=${d.roomId}`
    let data = await query(sql)
    if (data) {
        for (const [sid, client] of io.sockets.sockets.entries()) {
            data.map(iteam => {
                if (sid === iteam.sid) {
                    client.emit('deleteImage', d)
                }
            })
        }
    }
}*/

async function removeView(socket) {
    let sql = `DELETE FROM iteam_connect_view WHERE sid='${socket.id}'`
    let data = await query(sql)
    return data
}


async function _cmd(cmd) {
    var d = await exec(cmd)
    var data = { status: false }
    if (!d.error) {
        data = { status: true, pid: d.pid }
    }
    return data
}