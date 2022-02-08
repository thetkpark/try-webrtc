const http = require("http")
const express = require("express")
const app = express()

const server = http.createServer(app)
const io = require("socket.io")(server, {
	cors: {
		origin: "http://localhost:3000",
		credentials: true
	}
})

server.listen(8080)

app.get("/api/ping", (req, res) => {
	res.send({ success: true, timestamp: Date.now() })
})

io.on("connection", () => {
	console.log("A user is connected")
})
