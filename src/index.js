const http = require("http")
const express = require("express")
const app = express()
const cors = require("cors")

const server = http.createServer(app)
const io = require("socket.io")(server, {
	// cors: {
	// 	origin: "http://localhost:3000",
	// 	credentials: true
	// }
})

const meetings = {
	1: {
		name: "test 1",
		userInRoom: []
	},
	2: {
		name: "test 2",
		userInRoom: []
	},
	3: {
		name: "test 3",
		userInRoom: []
	}
}

const users = {}

server.listen(8080)

// Helper functions
const isInitiator = (meetingId) => {
	return meetings[meetingId].userInRoom.length === 0
}

const disconnectUser = (socket, meetingId) => {
	const meeting = meetings[meetingId]
	if (meeting) {
		meeting.userInRoom = meeting.userInRoom.filter(
			(user) => user.id !== socket.id
		)
		socket.in(meetingId).emit("user-left")
		socket.leave(meetingId)
		console.log(meeting)
		delete users[socket.id].meetingId
		console.log(users)
	}
}

app.use(cors())
app.get("/api/ping", (req, res) => {
	res.send({ success: true, timestamp: Date.now() })
})

app.get("/api/is-initiator", (req, res) => {
	res.send({ isInitiator: isInitiator(req.query.id) })
})

app.use(express.static("client/build"))

io.on("connection", (socket) => {
	console.log("A user is connected")
	if (!users[socket.id]) {
		users[socket.id] = { id: socket.id }
	}

	socket.on("set-username", ({ username }) => {
		users[socket.id] = { ...users[socket.id], username }
		console.log(users)
	})

	socket.on("join-meeting", ({ id }) => {
		// id is the meeting id
		const meeting = meetings[id]
		if (meeting) {
			users[socket.id] = { ...users[socket.id], meetingId: id }
			if (meeting.userInRoom.length < 2) {
				meeting.userInRoom.push({
					id: socket.id,
					username: users[socket.id].username
				})
				socket.join(id)

				// Send the initiator signal to start peering
				if (meeting.userInRoom.length === 2) {
					socket.in(id).emit("start-peering", true)
					socket.emit("start-peering", false)
				}
			}
		}
	})

	socket.on("user-signal", ({ id, signal }) => {
		socket.to(id).emit("new-signal", { signal })
	})

	socket.on("leave-meeting", () =>
		disconnectUser(socket, users[socket.id].meetingId)
	)

	// socket.on("end-meeting", ({ id }) => {
	// 	const meeting = meetings.find((meeting) => meeting.id === id)
	// 	if (meeting) {
	// 		meeting.userInRoom = []
	// 		io.in(id).emit("end-meeting")
	// 	}
	// })

	socket.on("disconnect", () => {
		disconnectUser(socket, users[socket.id].meetingId)
	})
})
