const http = require("http")
const express = require("express")
const app = express()

const server = http.createServer(app)
const io = require("socket.io")(server, {
	// cors: {
	// 	origin: "http://localhost:3000",
	// 	credentials: true
	// }
})

const users = {}

server.listen(8080)

app.get("/api/ping", (req, res) => {
	res.send({ success: true, timestamp: Date.now() })
})

io.on("connection", (socket) => {
	console.log("A user is connected")
	if (!users[socket.id]) {
		users[socket.id] = { id: socket.id }
	}

	socket.on("set-username", ({ username }) => {
		users[socket.id] = { ...users[socket.id], username }
		console.log(users)
		broadcastOnlineUsers(socket.id)
	})
})

const broadcastOnlineUsers = (socketId) => {
	io.sockets.emit("online-users", { users: Object.values(users) })
}
