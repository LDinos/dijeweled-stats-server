const WebSocketServer = require('ws')
const fs = require('fs');
const args = process.argv.slice(2);
const isDebug = args.includes('--debug');
const port = isDebug ? 6971 : 6970;
const wss = new WebSocketServer.Server({ port })
const { createReplay, readReplays, readReplayData } = require('./crud')

/**
* @typedef {{
*   gamemode: 'stats',
*   type: 'time_attack_300' | 'time_attack_180' | 'time_attack_60',
*   request: "retrieve_stats"
* } | {
*   gamemode: 'time_attack_300' | 'time_attack_180' | 'time_attack_60',
*   user: string,
*   matches: number,
*   style: number,
*   points: number,
*   request: "retrieve_stats"
* }} StatsData
*/

/**
* @typedef {Object} ReplayInfo
* @property {boolean} is_twist
* @property {number} replay_ver
* @property {string} gamemode
* @property {string} author
* @property {string} data
* @property {number} score
* @property {number} geode_xplier
* @property {string} date
* @property {string} time
* @property {string} title
*/

/**
* @typedef {{
*   type: 'get',
*   page: number,
*   filter: string
*   request: 'retrieve_replays'
* } | {
*   type: 'getData',
*   id: number
*   request: 'retrieve_replays'
* } | {
*   type: 'upload',
*   replay_info: ReplayInfo,
*   request: 'retrieve_replays'
* }} ReplaysData
*/

/**
* @typedef {StatsData | ReplaysData} ProcessedData
*/


if (isDebug) console.log("DEBUG MODE ENABLED")

wss.on('listening', () => {
    console.log(`WebSocket server is listening on port ${port}`);
});

wss.on('error', (/** @type {Error} */ err) => {
    console.error(`WebSocket server failed to start: ${err.message}`);
});

wss.on("connection", /** @param {import('ws')} ws */ ws => {
    console.log("Stats requester connected")
    ws.on("message", /** @param {import('ws').Data} data */ data => {
        const processed_data = process_data(data)
        if (processed_data) {
            console.log("Request:" + processed_data.request)
            switch (processed_data.request) {
                case "retrieve_stats":
                    retrieve_stats(processed_data, ws)
                    break;
                case "retrieve_replays":
                    retrieve_replays(processed_data, ws)
                    break;
            }
        }
    })

    ws.on("close", () => {
        console.log("Stats requester disconnected");
    })

    ws.onerror = function () {
        console.log("Some error occurred");
    }
})

/**
* @param {*} data
* @returns {ProcessedData | null}
*/
function process_data(data) {
    let processed_data;
    try {
        processed_data = JSON.parse(data)
    } catch (e) {
        console.log("Data is not JSON format")
        return null
    }
    return processed_data;
}


/**
 * @param {ReplaysData} processed_data
 * @param {import('ws')} ws
 * @returns {void}
 */
function retrieve_replays(processed_data, ws) {
    if (processed_data.type == "get") {
        console.log("retrieve_replays -> get")
        const page = processed_data.page ?? 1
        const filter = processed_data.filter
        readReplays(page, filter, (err, rows) => {
            console.log(rows.length)
            if (err) {
                console.error(err.message)
                ws.send(JSON.stringify({
                    response: "retrieve_replays",
                    status: "error",
                    error: err.message
                }))
                return;
            }
            ws.send(JSON.stringify({
                response: "retrieve_replays",
                status: "success",
                data: rows
            }))
        })
    }
    else if (processed_data.type == "getData") {
        console.log("retrieve_replays -> getData")
        const id = processed_data.id
        readReplayData(id, (err, result) => {
            console.log(result)
            if (err) {
                ws.send(JSON.stringify({
                    response: "getData",
                    status: "error",
                    error: err.message
                }))
                console.error(err)
            }
            else {
                ws.send(JSON.stringify({
                    response: "getData",
                    status: "success",
                    data: result[0].data
                }))
            }
        })

    }
    else if (processed_data.type == "upload") {
        console.log("retrieve_replays -> upload")
        const { title, author, time, gamemode, score, date, data, replay_ver, is_twist, geode_xplier } = processed_data.replay_info
        const parsed_data = (typeof data === 'string') ? data : JSON.stringify(data)
        createReplay(title, author, time, gamemode, score, date, parsed_data, replay_ver, is_twist, geode_xplier, (err, result) => {
            if (err) {
                ws.send(JSON.stringify({
                    response: "replay_upload",
                    status: "error",
                    error: err.message
                }))
                console.error(err)
            }
            else {
                ws.send(JSON.stringify({
                    response: "replay_upload",
                    status: "success",
                    id: result.id
                }))
                console.log(`Created replay ${result.id}`)
            }
        })
    }
}

/**
 * @param {StatsData} processed_data
 * @param {import('ws')} ws
 * @returns {void}
 */
function retrieve_stats(processed_data, ws) {
    const f_path = "data/" + processed_data.gamemode + ".json"
    switch (processed_data.gamemode) {
        case "time_attack_300":
        case "time_attack_180":
        case "time_attack_60":
            let f = fs.readFileSync(f_path)
            const name = processed_data.user
            let stats = JSON.parse(f)
            let matches = processed_data.matches
            let style = processed_data.style
            let points = processed_data.points

            if (stats[name] != undefined) {
                if (stats[name].matches > matches) matches = stats[name].matches
                if (stats[name].style > style) style = stats[name].style
                if (stats[name].points > points) points = stats[name].points
            }
            else console.log("First time log")

            stats[name] = {
                "matches": matches,
                "style": style,
                "points": points
            }
            const stats_updated = JSON.stringify(stats, null, 2)
            fs.writeFileSync(f_path, stats_updated)
            break;
        case "stats":
            switch (processed_data.type) {
                case "time_attack_300":
                case "time_attack_180":
                case "time_attack_60":
                    let f = fs.readFileSync("data/" + processed_data.type + ".json")
                    let stats = JSON.parse(f)
                    const s = JSON.stringify(stats)
                    ws.send(s)
                    break;
            }
            break;
    }
}