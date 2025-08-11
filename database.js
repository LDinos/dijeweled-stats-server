const sqlite3 = require('sqlite3').verbose()
const dbName = './data/replays/replays.db'

let db = new sqlite3.Database(dbName, (err) => {
    if(err) {
        console.error(err.message)
    }
    else {
        console.log('Database connected')
        db.run(`CREATE TABLE IF NOT EXISTS replays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            time TEXT,
            gamemode TEXT,
            score INTEGER,
            date TEXT,
            data LONGTEXT,
            replay_ver INTEGER,
            is_twist BOOL,
            geode_xplier INTEGER
            )`
        )
    }
})

module.exports = db