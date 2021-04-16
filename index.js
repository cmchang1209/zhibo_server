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

    socket.on('addChanelImage', function(data) {
        addChanelImage(socket, data)
    })

    socket.on('playImage', function(data) {
        playImage(socket, data)
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

ioPiClient.on("echoPlayImage", (data) => {
    //if (data.data.status) {
        //changeChanelStatus(data, 2)
        ioViewClient.emit('changeChanelStatus', { roomId: data.me.roomId, chanel: data.me.chanel, status: 2, port: data.data.port, from: 'index' })
    //}
    for (const [sid, client] of io.sockets.sockets.entries()) {
        if (sid === data.indexSid) {
            client.emit('echoPlayImage', { me: data.me, data: data.data })
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
    let sql = `SELECT pi.id, pi.no, pi.mac, pi.name, cpi.status AS status, cam.content AS children FROM iteam_pi AS pi LEFT JOIN iteam_connect_pi AS cpi ON cpi.pi_id=pi.id LEFT JOIN iteam_connect_cam as cam ON cpi.pi_id=cam.pi_id`
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
        socket.emit('echoAddChanelImage', { me: d, data: data })
    }
}

async function changeChanelStatus(d, status) {
    let sql = `UPDATE iteam_chanel SET status=${status} WHERE room_id=${d.me.roomId} AND chanel=${d.me.chanel}`
    let data = await query(sql)
    return data
    if (data) {
        /*ioViewClient.emit('changeChanelStatus', { roomId: d.me.roomId, chanel: d.me.chanel, status: status, port: d.data.port })*/
        /*sql = `SELECT sid FROM iteam_connect_view WHERE room_id=${d.me.roomId}`
        data = await query(sql)
        if (data) {
            for (const [sid, client] of ioViewClient.sockets.sockets.entries()) {
                var val = data.find((item)=>{
                    return item.sid === sid
                })
                if (val) {
                    client.emit('changeChanelStatus', { roomId: d.me.roomId, chanel: d.me.chanel, status: status, port: d.data.port })
                }
            }
        }*/
    }
}

async function playImage(socket, d) {
    let sql = `SELECT chanel.status AS c_status, chanel.usb_id, cpi.status AS p_status, cam.content, cpi.sid, p_used.port_no FROM iteam_chanel AS chanel LEFT JOIN iteam_connect_pi AS cpi ON chanel.pi_id=cpi.pi_id LEFT JOIN iteam_connect_cam AS cam ON chanel.pi_id=cam.pi_id LEFT JOIN iteam_port_used AS p_used ON (chanel.pi_id=p_used.pi_id AND chanel.usb_id=p_used.usb_id) WHERE chanel.room_id=${d.roomId} AND chanel.chanel=${d.chanel}`
    let data = await query(sql)
    if (data.length > 0) {
        if (data[0].p_status) {
            var imageData = JSON.parse(data[0].content)
            var imageInfo = imageData.filter((item) => {
                return item.usb_id === data[0].usb_id
            })
            if (imageInfo.length > 0) {
                var cmd = `lsof -i:${data[0].port_no} -t`
                exec(cmd, (error, stdout, stderr) => {
                    var pid = stdout * 1
                    if (!pid) {
                        cmd = `/home/ubuntu/run_ws_relay.sh ${FFmpegWsd} ${data[0].port_no} ${data[0].port_no+1}`
                        _cmd(cmd) /* 斷開後才會有回應，靠下條命令判斷是否成功 */
                        cmd = `lsof -i:${data[0].port_no} -t`
                        exec(cmd, (error, stdout, stderr) => {
                            pid = stdout * 1
                            if (pid) {
                                ioPiClient.emit('runFFmpeg', {
                                    piSid: data[0].sid,
                                    port: data[0].port_no,
                                    imageInfo: imageInfo,
                                    indexSid: socket.id,
                                    me: d
                                })
                            } else {
                                //ws_relay.js 資料接收/轉發未建立成功
                                socket.emit('echoPlayImage', { me: d, data: { status: false, code: '0003' } })
                            }
                        })
                    } else {
                        ioPiClient.emit('runFFmpeg', {
                            piSid: data[0].sid,
                            port: data[0].port_no,
                            imageInfo: imageInfo,
                            indexSid: socket.id,
                            me: d
                        })
                    }
                })
            } else {
                //usb port 沒有接入設備
                socket.emit('echoPlayImage', { me: d, data: { status: false, code: '0002' } })
            }
        } else {
            //pi未連線
            socket.emit('echoPlayImage', { me: d, data: { status: false, code: '0001' } })
        }
    }
}

async function genID(length) {
    return Number(Math.random().toString().substr(3, length) + Date.now()).toString(36);
}

async function _cmd(cmd) {
    var d = await exec(cmd)
    var data = { status: false }
    if (!d.error) {
        data = { status: true, pid: d.pid }
    }
    return data
}