import './App.css';
import io from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';

// Ganti dengan URL backend Railway Anda
const socket = io.connect("https://chat-app-backend-production-045f.up.railway.app");

function App() {
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const chatBodyRef = useRef(null); // Untuk auto-scroll

  // Fungsi untuk auto-scroll ke pesan terbaru
  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  // Kirim pesan
  const sendMessage = () => {
    if (message !== '' && user !== '') {
      const messageData = { user, message };
      socket.emit('send_message', messageData);
      
      // Tampilkan pesan kita sendiri, sekarang termasuk timestamp
      const ownMessage = { ...messageData, timestamp: new Date().toISOString(), fromSelf: true };
      setChatLog((list) => [...list, ownMessage]);
      setMessage('');
    }
  };

  useEffect(() => {
    // Listener untuk menerima riwayat chat saat pertama kali terhubung
    socket.on('chat_history', (history) => {
      setChatLog(history);
    });

    // Listener untuk menerima pesan baru dari user lain
    socket.on('receive_message', (data) => {
      setChatLog((list) => [...list, data]);
    });

    // Cleanup listeners
    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
    };
  }, []);

  // Auto-scroll setiap kali chatLog berubah
  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);

  // Fungsi untuk format waktu
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h2>Real-Time Chat (with History)</h2>
        </div>
        <div className="chat-body" ref={chatBodyRef}>
          {chatLog.map((content, index) => (
            <div key={index} className={content.fromSelf ? "message-self" : "message-other"}>
              <div className="message-content">
                <p>{content.message}</p>
              </div>
              <div className="message-meta">
                <span>{content.fromSelf ? "You" : content.user}</span>
                <span>{formatTimestamp(content.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-footer">
          <input 
            type="text" 
            placeholder="Nama Anda..." 
            onChange={(event) => setUser(event.target.value)}
          />
          <input 
            type="text"
            value={message} 
            placeholder="Ketik pesan..." 
            onChange={(event) => setMessage(event.target.value)}
            onKeyPress={(event) => {event.key === 'Enter' && sendMessage()}}
          />
          <button onClick={sendMessage}>Kirim</button>
        </div>
      </div>
    </div>
  );
}

export default App;
