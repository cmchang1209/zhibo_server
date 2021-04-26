#!/usr/bin/env node

/* golbal params */
const piPort = 8090
const serverIndexPort = 8004
const minPort = 55000
const maxPort = 60000
const awsHost = 'videostream.fidodarts.com'
const FFmpegWsd = 'fidodarts'
/* socket io server */
const { Server } = require("socket.io")
const piServer = new Server(piPort)
const indexServer = new Server(serverIndexPort)
/* batabase params */
const { query } = require('./async-db')
const { _exec } = require('./cmd')

const exec = require('child_process').exec

/* 初始化系統 */
init()

async function init() {
    let data = await initTempTable()
    if (data) {
        /* 每次PI連接時都會觸發事件： */
        piServer.on("connection", (socket) => {
            console.info(`Client connected [id=${socket.id}]`)

            socket.on("getId", (data) => {
                getId(data, socket)
            })

            socket.on("getPort", (data) => {
                getPort(data, socket)
            })

            socket.on("setCamData", (data) => {
                setCamData(data, socket)
            })
            socket.on("fcnrEcho", (data) => {
                var port = data.port * 1
                var cmd = `sudo lsof -i:${port} -t`
                _exec(cmd).then(value => {
                    data.status = true
                    indexServer.emit('fcnrEcho', data)
                }).catch(err => {
                    data.status = false
                    indexServer.emit('fcnrEcho', data)
                })
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

async function getId(d, socket) {
    let sql = `SELECT id FROM iteam_pi WHERE mac='${d.mac}'`
    let data = await query(sql)
    if (data) {
        /* 設定和取得連線相關資料 */
        setConnectData(data, socket.id)
        socket.emit('setId', data)
    } else {
        console.log('not find pi id')
    }
}

async function setConnectData(d, sid) {
    let pi_id = d[0].id
    /* add or update iteam_connect_pi status & sid */
    let sql = `SELECT * FROM iteam_connect_pi WHERE pi_id=${pi_id}`
    let data = await query(sql)
    if (data.length === 0) {
        sql = `INSERT INTO iteam_connect_pi (pi_id, sid) VALUES (${pi_id}, '${sid}')`
        data = await query(sql)
    } else {
        sql = `UPDATE iteam_connect_pi SET sid='${sid}', status=1 WHERE pi_id=${pi_id}`
        data = await query(sql)
    }
}

async function getPort(d, socket) {
    /* 分配 port */
    let sql = `SELECT port_no FROM iteam_port_used WHERE pi_id=${d.pi_id} ORDER BY usb_id ASC`
    let data = await query(sql)
    var port = []
    if (data.length === 0) {
        sql = `SELECT port_no FROM iteam_port_used`
        var usedPort = await query(sql)
        sql = `INSERT INTO iteam_port_used (pi_id, usb_id, port_no) VALUES `
        for (var i = minPort; i <= maxPort; i += 2) {
            var r = usedPort.find((item) => {
                return i === item.port_no
            })
            if (!r) {
                port.push(i)
                sql += `(${d.pi_id}, ${port.length}, ${i})`
                if (port.length < 4) {
                    sql += `, `
                } else if (port.length === 4) {
                    break
                }
            }
        }
        await query(sql)
    } else {
        data.map((item) => {
            port.push(item.port_no)
        })
    }
    socket.emit('setPort', port)
}

async function setCamData(d, socket) {
    let sql = `UPDATE iteam_port_used SET dev_name='${d.camData.dev_name}', port_name='${d.camData.port_name}', type=${d.camData.type} WHERE pi_id=${d.pi_id} AND usb_id=${d.camData.usb_id}`
    if(d.camData.dev_name === null) {
        sql = `UPDATE iteam_port_used SET dev_name=NULL, port_name=NULL, type=${d.camData.type} WHERE pi_id=${d.pi_id} AND usb_id=${d.camData.usb_id}`
    }
    let data = await query(sql)
    if (data) {
        if (d.camData.dev_name === null) {
            var cmd = `lsof -i:${d.port} -t`
            _exec(cmd).then(value => {
                cmd = `kill -9 ${value}`
                _exec(cmd).then(value => {}).catch(err => {
                    console.log(`kill run_ws_relay pid error function setCamData : ${d}`)
                })
            }).catch(err => {})
        } else {
            var cmd = `lsof -i:${d.port} -t`
            _exec(cmd).then(value => {
                    socket.emit('runFFmpeg', { port: d.port, port_name: d.camData.port_name, type: d.camData.type, usb_id: d.camData.usb_id })
                })
                .catch(err => {
                    var cmd = `/home/ubuntu/run_ws_relay.sh '${FFmpegWsd}' ${d.port} ${d.port+1}`
                    _exec(cmd)
                    socket.emit('runFFmpeg', { port: d.port, port_name: d.camData.port_name, type: d.camData.type, usb_id: d.camData.usb_id })
                })
        }
    } else {
        console.log(`not update iteam_port_used for function setCamData : ${d}`)
    }
}


async function disConnecEquipment(sid) {
    let sql = `UPDATE iteam_connect_pi SET status=0 WHERE sid='${sid}'`
    let data = await query(sql)
    sql = `SELECT pi_id FROM iteam_connect_pi WHERE sid='${sid}'`
    data = await query(sql)
    var pi_id = data[0].pi_id
    sql = `UPDATE iteam_port_used SET dev_name=NULL, port_name=NULL, type=1 WHERE pi_id=${pi_id}`
    data = await query(sql)
    sql = `SELECT port_no FROM iteam_port_used WHERE pi_id=${pi_id}`
    data = await query(sql)
    data.map((item) => {
        var cmd = `lsof -i:${item.port_no} -t`
        _exec(cmd).then(value => {
            cmd = `kill -9 ${value}`
            _exec(cmd).then(value => {}).catch(err => {
                console.log(`kill run_ws_relay pid error function setCamData : ${d}`)
            })
        }).catch(err => {})
    })
}




indexServer.on("connection", (socket) => {
    console.info(`indexClient connected [id=${socket.id}]`)
    socket.on("disconnect", () => {
        console.info(`indexClient gone [id=${socket.id}]`)
    })
    socket.on("fcnr", (data) => {
        fcnr(data)
    })
})

async function fcnr(d) {
    var sql = `SELECT sid FROM iteam_connect_pi WHERE pi_id=${d.id} AND status=1`
    var data = await query(sql)
    var pi = null
    for (const [sid, client] of piServer.sockets.sockets.entries()) {
        if (sid === data[0].sid) {
            pi = client
        }
    }
    var cmd = `lsof -u pi`
    _exec(cmd).then(value => {
        var cmd = `pkill -u pi`
        _exec(cmd).then(value => {
            pi.emit('fcnr', d)
        }).catch(err => {
            console.log(`'pkill -u pi' error function fcnr : ${d}`)
        })
    }).catch(err => {
        pi.emit('fcnr', d)
    })
}

async function sh(cmd) {
    var d = await exec(cmd)
    var data = { status: false }
    if (!d.error) {
        data = { status: true, pid: d.pid }
    }
    return data
}