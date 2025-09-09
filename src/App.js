import './App.css';
import io from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';

// Ganti dengan URL backend Railway Anda yang benar
const socket = io.connect("https://chat-app-backend-production-045f.up.railway.app/");

function App() {
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  
  // --- BARU: useRef untuk referensi ke elemen body chat ---
  const chatBodyRef = useRef(null);

  // --- BARU: Fungsi untuk otomatis scroll ke bawah ---
  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  const sendMessage = () => {
    if (message !== '' && user !== '') {
      const messageData = { user, message };
      socket.emit('send_message', messageData);
      
      const ownMessage = { 
        ...messageData, 
        timestamp: new Date().toISOString(), 
        fromSelf: true 
      };
      setChatLog((list) => [...list, ownMessage]);
      setMessage('');
    }
  };

  useEffect(() => {
    socket.on('chat_history', (history) => {
      setChatLog(history);
    });

    socket.on('receive_message', (data) => {
      setChatLog((list) => [...list, data]);
    });

    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
    };
  }, []);

  // --- BARU: useEffect untuk memanggil auto-scroll setiap kali ada pesan baru ---
  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);

  // --- BARU: Fungsi untuk memformat timestamp (Waktu Indonesia Barat) ---
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta', // Set zona waktu ke WIB
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h2>Real-Time Chat</h2>
        </div>
        {/* --- BARU: Tambahkan ref ke chat-body --- */}
        <div className="chat-body" ref={chatBodyRef}>
          {chatLog.map((content, index) => (
            <div key={index} className={content.fromSelf ? "message-self" : "message-other"}>
              <div className="message-content">
                <p>{content.message}</p>
              </div>
              <div className="message-meta">
                {/* --- BARU: Logika untuk memberi warna pada username 'fuzi' --- */}
                <span style={{ color: content.user && content.user.toLowerCase() === 'fuzi' ? 'red' : 'inherit' }}>
                  {content.fromSelf ? "You" : content.user}
                </span>
                {/* --- BARU: Tampilkan timestamp --- */}
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
