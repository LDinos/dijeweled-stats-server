const WebSocketServer = require('ws')
const fs = require('fs');
const wss = new WebSocketServer.Server({ port: 6970})
console.log("Stats server online")

wss.on("connection", ws => {
    console.log("Stats requester connected")
    ws.on("message", data => {
        const processed_data = process_data(data)
        if (processed_data != false) {
            const f_path = "data/"+processed_data.gamemode+".json"
            switch(processed_data.gamemode) {
                case "time_attack_300":
                case "time_attack_180":
                case "time_attack_60":
                    let f = fs.readFileSync(f_path)
                    const name =  processed_data.user
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
                        "matches" : matches,
                        "style" : style,
                        "points" : points
                    }
                    const stats_updated = JSON.stringify(stats, null, 2)
                    fs.writeFileSync(f_path, stats_updated)
                    break;
                case "stats":
                    switch (processed_data.type) {
                        case "time_attack_300":
                        case "time_attack_180":
                        case "time_attack_60":
                            let f = fs.readFileSync("data/"+processed_data.type+".json")
                            let stats = JSON.parse(f)
                            const s = JSON.stringify(stats)
                            ws.send(s)
                            break;
                    }
                    break;
            } 
        }
    })

     //Player disconnected
     ws.on("close", () => {
        console.log("Stats requester disconnected");
    })

    ws.onerror = function () {
        console.log("Some error occurred");
    }
})

function process_data(data) {
    let processed_data;
        try {
            processed_data = JSON.parse(data)
        } catch(e) {
            console.log("Data is not JSON format")
            return processed_data = false
        }
        return processed_data;
}