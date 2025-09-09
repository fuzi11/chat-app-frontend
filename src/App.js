import './App.css';
import io from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';

// Ganti dengan URL backend Railway Anda yang benar
const socket = io.connect("https://chat-app-backend-production-045f.up.railway.app/");

// ===================================================================
// KOMPONEN UNTUK HALAMAN LOGIN
// ===================================================================
function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username) {
      setError('Username tidak boleh kosong.');
      return;
    }

    const FUZI_SECRET_PASSWORD = "qwerty123456789";

    // Cek jika user adalah fuzi
    if (username.toLowerCase() === 'fuzi') {
      if (password === FUZI_SECRET_PASSWORD) {
        onLoginSuccess({ name: 'fuzi', isModerator: true });
      } else {
        setError('Password salah untuk moderator.');
      }
    } else {
      // Login untuk user biasa (tanpa password)
      onLoginSuccess({ name: username, isModerator: false });
    }
  };

  return (
    <div className="login-container">
      <h2>Login ke Chat</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password (khusus fuzi)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Masuk</button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}


// ===================================================================
// KOMPONEN UNTUK HALAMAN CHAT
// ===================================================================
function ChatPage({ user, onLogout }) {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const chatBodyRef = useRef(null);

  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  const sendMessage = () => {
    if (message) {
      const messageData = { 
        user: user.name, 
        message: message,
        isModerator: user.isModerator 
      };
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
    socket.on('chat_history', (history) => setChatLog(history));
    socket.on('receive_message', (data) => setChatLog((list) => [...list, data]));
    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h2>Real-Time Chat</h2>
          <p>Login sebagai: <strong>{user.name}</strong></p>
        </div>
        <button onClick={onLogout} className="logout-button">Keluar</button>
      </div>
      <div className="chat-body" ref={chatBodyRef}>
        {chatLog.map((content, index) => (
          <div key={index} className={content.fromSelf ? "message-self" : "message-other"}>
            <div className="message-content"><p>{content.message}</p></div>
            <div className="message-meta">
              <span style={{ color: content.isModerator ? 'red' : 'inherit', fontWeight: content.isModerator ? 'bold' : 'normal' }}>
                {content.fromSelf ? "You" : content.user}
                {content.isModerator && ' (Moderator)'}
              </span>
              <span>{formatTimestamp(content.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-footer">
        <input 
          type="text"
          value={message} 
          placeholder="Ketik pesan..." 
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {e.key === 'Enter' && sendMessage()}}
        />
        <button onClick={sendMessage}>Kirim</button>
      </div>
    </div>
  );
}


// ===================================================================
// KOMPONEN UTAMA APP (PENGATUR TAMPILAN)
// ===================================================================
function App() {
  const [user, setUser] = useState(null); // Awalnya null, berarti belum login

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="App">
      {!user ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <ChatPage user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
