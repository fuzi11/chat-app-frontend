import './App.css';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

// --- LOG DIAGNOSTIK #1 ---
console.log("File App.js berhasil dimuat.");

// Ganti dengan URL backend Railway Anda yang sudah benar
const backendUrl = "https://chat-app-backend-production-045f.up.railway.app/";
console.log("Mencoba terhubung ke:", backendUrl); // LOG DIAGNOSTIK #2

const socket = io.connect(backendUrl);

function App() {
  // --- LOG DIAGNOSTIK #3 ---
  console.log("Komponen App sedang dirender.");

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [chatLog, setChatLog] = useState([]);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState('');

  useEffect(() => {
    // --- LOG DIAGNOSTIK #4 ---
    console.log("useEffect hook berjalan. Menyiapkan event listeners...");

    function onConnect() {
      console.log("EVENT: 'connect' - Berhasil terhubung ke server!");
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log("EVENT: 'disconnect' - Koneksi terputus.");
      setIsConnected(false);
    }

    function onChatHistory(history) {
      console.log("EVENT: 'chat_history' - Menerima riwayat chat:", history);
      setChatLog(history);
    }
    
    function onReceiveMessage(newMessage) {
        console.log("EVENT: 'receive_message' - Menerima pesan baru:", newMessage);
      setChatLog(prevLog => [...prevLog, newMessage]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat_history', onChatHistory);
    socket.on('receive_message', onReceiveMessage);

    // Fungsi cleanup
    return () => {
      console.log("Cleanup: Menghapus event listeners.");
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat_history', onChatHistory);
      socket.off('receive_message', onReceiveMessage);
    };
  }, []);

  const sendMessage = () => {
    if (user && message) {
      const messageData = { user, message };
      console.log("Mengirim pesan:", messageData);
      socket.emit('send_message', messageData);
      setChatLog(prevLog => [...prevLog, { ...messageData, fromSelf: true }]);
      setMessage('');
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h2>Real-Time Chat</h2>
          <p>Status Koneksi: {isConnected ? 'Terhubung ✅' : 'Terputus ❌'}</p>
        </div>
        <div className="chat-body">
          {chatLog.map((content, index) => (
            <div key={index} className={content.fromSelf ? "message-self" : "message-other"}>
              <p><strong>{content.user || (content.fromSelf ? 'You' : 'Anonymous')}:</strong> {content.message}</p>
            </div>
          ))}
        </div>
        <div className="chat-footer">
          <input type="text" placeholder="Nama Anda" onChange={e => setUser(e.target.value)} />
          <input type="text" value={message} placeholder="Ketik pesan..." onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} />
          <button onClick={sendMessage}>Kirim</button>
        </div>
      </div>
    </div>
  );
}

export default App;
