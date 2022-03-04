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

const isInitiator = (meetingId) => {
	return meetings[meetingId].userInRoom.length === 0
}

app.use(cors())
app.get("/api/ping", (req, res) => {
	res.send({ success: true, timestamp: Date.now() })
})

app.get("/api/is-initiator", (req, res) => {
	res.send({ isInitiator: isInitiator(req.query.id) })
})

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
			if (isInitiator(id)) {
				meeting.userInRoom.push({
					id: socket.id,
					username: users[socket.id].username,
					signals: []
				})
				socket.join(id)
			} else {
				// There is someone waiting in the room
				meeting.userInRoom.push({
					id: socket.id,
					username: users[socket.id].username,
					signals: []
				})
				socket.join(id)

				// Send the initiator signal to start peering
				io.in(id).emit("start-peering")
			}
		}
	})

	socket.on("user-signal", ({ id, signal }) => {
		socket.to(id).emit("new-signal", { signal })
	})

	socket.on("user-disconnect", ({ id: meetingId }) => {
		const meeting = meetings[id]
		if (meeting) {
			const user = meeting.userInRoom.find((user) => user.id === socket.id)
			if (user) {
				meeting.userInRoom = meeting.userInRoom.filter(
					(user) => user.id !== socket.id
				)
				socket.leave(meetingId)
			}
		}
	})

	socket.on("end-meeting", ({ id }) => {
		const meeting = meetings.find((meeting) => meeting.id === id)
		if (meeting) {
			meeting.userInRoom = []
			io.in(id).emit("end-meeting")
		}
	})
})
