require('dotenv').config(); 
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const dayjs = require('dayjs');
const userInfos = {}; 

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",  // 일단 개발중에는 모두 허용, 배포 땐 https://dimirc-front.vercel.app
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

app.use(express.static('public'));

const roomMessages = {}; 
let waitingUser = null;  
let roomIdCounter = 1;


app.get('/supabaseClient.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
      const SUPABASE_URL = "${process.env.SUPABASE_URL}";
      const SUPABASE_ANON_KEY = "${process.env.SUPABASE_ANON_KEY}";
      window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        persistSession: true,
        autoRefreshToken: true
      });
    `);
  });

function saveChatLog(roomId) {
    if (!roomId) return;
    const logs = roomMessages[roomId];
    if (!logs) return;

    const participants = [...new Set(logs.map(log => `${log.username}(${log.ip})`))];
    const filename = `${dayjs().format('YYYY-MM-DD_HH-mm')}_${participants.join('-')}.txt`;

    const content = logs.map(log =>
        `${log.timestamp} ${log.username}(${log.email},${log.ip}): ${log.message}`
    ).join('\n');

    if (!fs.existsSync('chat_logs')) {
        fs.mkdirSync('chat_logs');
    }

    fs.writeFileSync(`chat_logs/${filename}`, content);
    console.log(`${filename} saved`);
    delete roomMessages[roomId];
}


io.on('connection', (socket) => {

    socket.on('register', ({ username, major, email }) => {
        const user = { socket, username, major, email};
        userInfos[socket.id] = { username, ip: socket.handshake.address , email};
        
        if (waitingUser) {
            const roomId = 'room-' + roomIdCounter++;
            socket.join(roomId);
            waitingUser.socket.join(roomId);
            roomMessages[roomId] = [];

            console.log(`matched ${waitingUser.username} (${waitingUser.major}) <-> ${username} (${major})`);

            socket.emit('matched', {
                roomId,
                partner: {
                    username: waitingUser.username,
                    major: waitingUser.major
                }
            });

            waitingUser.socket.emit('matched', {
                roomId,
                partner: {
                    username,
                    major
                }
            });

            waitingUser = null;
        } else {
            waitingUser = user;
            socket.emit('waiting');
        }
    });

    socket.on('message', ({ roomId, message }) => {
        const user = userInfos[socket.id] || { username: socket.id, ip: '-', email: '-' };
        const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const log = { timestamp, username: user.username, ip: user.ip, email:user.email, message };
        roomMessages[roomId]?.push(log);
        socket.to(roomId).emit('message', {username :user.username, message});
    });
    

    socket.on('disconnecting', () => {
        const username = userInfos[socket.id] || socket.id;

        const roomId = [...socket.rooms].find(r => r !== socket.id);
        if (roomId) {
            socket.to(roomId).emit('partner_left');
            saveChatLog(roomId);  
        }
    });

    socket.on('disconnect', () => {
    });
        if (waitingUser && waitingUser.socket.id === socket.id) {
            waitingUser = null;
        }
        delete userInfos[socket.id];
    });

  
server.listen(PORT, '0.0.0.0' , () => {
    console.log(`server running: http://localhost:${PORT}`);
});
