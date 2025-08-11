const db = require('./database')

const createReplay = (title, author, time, gamemode, score, date, data, version, is_twist, geode_xplier, callback) => {
    const sql = `INSERT INTO replays 
    (title, author, time, gamemode, score, date, data, replay_ver, is_twist, geode_xplier)
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    db.run(sql, [title, author, time, gamemode, score, date, data, version, is_twist, geode_xplier], function (err) {
        callback(err, {id: this.lastId})
    })
}

const readReplays = (page, filter, callback) => {
    const pageSize = 15
    const offset = (page-1) * pageSize
    const sqlwhere = (filter != '') ? `WHERE id = ${filter}` : ''
    const sql = `
        SELECT id, title, author, time, gamemode, score, date, replay_ver, is_twist, geode_xplier
        FROM replays ${sqlwhere} 
        ORDER BY id 
        DESC LIMIT ? 
        OFFSET ?`
    db.all(sql, [pageSize, offset], function (err, rows) {
        callback(err, rows)
    })
}

const readReplayData = (id, callback) => {
    const sql = `SELECT data FROM replays WHERE id = ?`
    db.all(sql, [id], function (err, rows) {
        callback(err, rows)
    })
}

module.exports = {createReplay, readReplays, readReplayData}