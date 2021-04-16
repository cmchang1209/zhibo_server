#!/usr/bin/env node

/* golbal params */
const piPort = 8090
const serverIndexPort = 8004
const minPort = 50000
const maxPort = 60000
const awsHost = 'videostream.fidodarts.com'
const FFmpegWsd = 'fidodarts'
/* socket io server */
const { Server } = require("socket.io")
const piServer = new Server(piPort)
const indexServer = new Server(serverIndexPort)
/* batabase params */
const { query } = require('./async-db')

const exec = require('child_process').exec

/* 初始化系統 */
init()

async function init() {
    let data = await initTempTable()
    if (data) {
        /* 每次PI連接時都會觸發事件： */
        piServer.on("connection", (socket) => {
            console.info(`Client connected [id=${socket.id}]`)
            socket.on("run", (data) => {
                setConnecEquipment(data.mac, socket.id, data.camData)
            })
            socket.on("fcnrEcho", (data) => {
                indexServer.emit('fcnrEcho', data)
            })

            socket.on("echoPlayImage", (data) => {
                indexServer.emit('echoPlayImage', data)
            })

            // 當套接字斷開連接時，將其從列表中刪除：
            socket.on("disconnect", () => {
                console.info(`Client gone [id=${socket.id}]`)
                disConnecEquipment(socket.id)
            })
        })
    }
}

async function initTempTable() {
    let sql = `TRUNCATE TABLE iteam_connect_pi`
    let data = await query(sql)
    if (data) {
        sql = `TRUNCATE TABLE iteam_port_used`
        data = await query(sql)
        if (data) {
            sql = `TRUNCATE TABLE iteam_connect_cam`
            data = await query(sql)
        }
    }
    return data
}


async function setConnecEquipment(mac, sid, cam) {
    var camData = []
    cam.map((citem, cindex) => {
        var nos = citem.name.split(' (usb-0000:01:00.0-1.')
        var item = {}
        item.usb_id = (nos[1].replace(')', '') * 1) - 1
        item.name = nos[0]
        item.dev_name = citem.devices[0].name
        item.size = null
        item.fps = null
        citem.devices[0].formats.map((fitem) => {
            var w = 1920
            if (fitem[0] && typeof(fitem[0].size) != 'undefined') {
                fitem[0].size.map((sitem) => {
                    var sizes = sitem.size.split('x')
                    if ((sizes[0] * 1) <= w && (sizes[0] * 1) >= 720) {
                        w = sizes[0] * 1
                        item.size = sitem.size
                        sitem.fps.map((fitem) => {
                            if ((fitem * 1) >= 24) {
                                item.fps = fitem * 1
                            }
                        })
                    }
                })
                item.format = fitem[0].format
            }
        })
        if ((item.name === 'USB Video: USB Video' || item.name === 'USB3. 0 capture: USB3. 0 captur') && item.format === 'MJPG') {
            item.type = 1
            item.no = `Port-${item.usb_id + 1}-Screen`
        } else {
            item.type = 2
            item.no = `Port-${item.usb_id + 1}-Cam`
        }
        camData[item.usb_id] = item
    })
    for (i = 0; i <= 3; i++) {
        if (!camData[i]) {
            camData[i] = {}
        }
    }
    camData = JSON.stringify(camData)
    let sql = `SELECT id FROM iteam_pi WHERE mac='${mac}'`
    let data = await query(sql)
    let myId = data[0].id
    sql = `SELECT * FROM iteam_connect_pi WHERE pi_id=${myId}`
    data = await query(sql)
    if (data.length === 0) {
        sql = `INSERT INTO iteam_connect_pi (pi_id, sid) VALUES ('${myId}', '${sid}')`
        data = await query(sql)
        sql = `SELECT port_no FROM iteam_port_used`
        var usedPort = await query(sql)
        var port = []
        sql = `INSERT INTO iteam_port_used (pi_id, usb_id, port_no) VALUES `
        for (var i = minPort; i <= maxPort; i += 2) {
            var r = usedPort.find((item, index, array) => {
                return i === item.port_no
            })
            if (!r) {
                port.push(i)
                sql += `(${myId}, ${port.length - 1}, ${i})`
                if (port.length < 4) {
                    sql += `, `
                } else if (port.length === 4) {
                    break
                }
            }
        }
        await query(sql)
    } else {
        if (data[0].status === 0 || data[0].sid !== sid) {
            sql = `UPDATE iteam_connect_pi SET sid='${sid}', status=1 WHERE pi_id=${myId}`
            data = await query(sql)
        }
    }
    if (data) {
        sql = `SELECT content FROM iteam_connect_cam WHERE pi_id=${myId}`
        data = await query(sql)
        if (data.length === 0) {
            sql = `INSERT INTO iteam_connect_cam (pi_id, content) VALUES (${myId}, '${camData}')`
            data = await query(sql)
        } else {
            if (data[0].content !== camData) {
                sql = `UPDATE iteam_connect_cam SET content='${camData}' WHERE pi_id=${myId}`
                data = await query(sql)
            }
        }
    }
    return data
}


async function disConnecEquipment(sid) {
    let sql = `UPDATE iteam_connect_pi SET status=0 WHERE sid='${sid}'`
    let data = await query(sql)
    return data
}


indexServer.on("connection", (socket) => {
    console.info(`indexClient connected [id=${socket.id}]`)
    socket.on("disconnect", () => {
        console.info(`indexClient gone [id=${socket.id}]`)
    })
    socket.on("fcnr", (data) => {
        fcnr(data)
    })

    socket.on("runFFmpeg", (data) => {
        var url = `http://${awsHost}:${data.port}/${FFmpegWsd}`
        var size = data.imageInfo[0].size
        if(data.imageInfo[0].type === 1) {
            size = '720x404'
            //var cmd = `-nostdin -loglevel error -f v4l2 -framerate ${data.imageInfo[0].fps} -video_size ${size} -i ${data.imageInfo[0].dev_name} -f mpegts -codec:v mpeg1video -r 59.94 -s ${size} -aspect 16:9 -an -bf 0 -b:v 524286000 -maxrate 524286000 -muxdelay 0.001 ${url}`
            //var cam = `ffmpeg -nostdin -loglevel error -i "${data.imageInfo[0].dev_name}" -r ${data.imageInfo[0].fps} -q 0 -f mpegts -codec:v mpeg1video ${url} &`
        } else {
            //var cmd = `-nostdin -loglevel error -f v4l2 -framerate ${data.imageInfo[0].fps} -video_size ${size} -i ${data.imageInfo[0].dev_name} -f mpegts -codec:v mpeg1video -s ${size} -an -bf 0 -b:v 524286000 -maxrate 524286000 -muxdelay 0.001 ${url}`
            //console.log(cmd)
        }
        //var cmd = `-nostdin -loglevel error -i ${data.imageInfo[0].dev_name} -r ${data.imageInfo[0].fps} -video_size ${size} -q 0 -f mpegts -codec:v mpeg1video ${url} &`
        for (const [sid, client] of piServer.sockets.sockets.entries()) {
            if (sid === data.piSid) {
                client.emit('runFFmpeg', data)
            }
        }
    })
})

async function fcnr(data) {
    var cmd = `sudo pkill -u pi`
    var d = await sh(cmd)
    if (d.status) {
        var piSid = await getPiSid(data.data.id)
        for (const [sid, client] of piServer.sockets.sockets.entries()) {
            if (sid === piSid) {
                client.emit('fcnr', data)
            }
        }
    } else {
        indexServer.emit('fcnrEcho', { status: false, indexSid: data.indexSid })
    }
}

async function getPiSid(id) {
    let sql = `SELECT sid FROM iteam_connect_pi WHERE id=${id} AND status=1`
    let data = await query(sql)
    return data[0].sid
}

async function sh(cmd) {
    var d = await exec(cmd)
    var data = { status: false }
    if (!d.error) {
        data = { status: true, pid: d.pid }
    }
    return data
}