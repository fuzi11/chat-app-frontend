import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// ===================================================================
// KONFIGURASI UTAMA - Pastikan URL ini benar
// ===================================================================
const SOCKET_URL = "https://chat-app-backend-production-045f.up.railway.app"; // TANPA GARIS MIRING DI AKHIR

const socket = io.connect(SOCKET_URL);

// ===================================================================
// KOMPONEN LOGIN
// ===================================================================
function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username) {
      setError('Username tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${SOCKET_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || "Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Selamat Datang</h2>
      <p>Silakan masuk untuk memulai chat</p>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} />
      <button onClick={handleLogin} disabled={loading}>{loading ? 'Loading...' : 'Masuk'}</button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}


// ===================================================================
// KOMPONEN PROFIL (TANPA UPLOAD FOTO)
// ===================================================================
function ProfilePage({ user, onProfileUpdated, onBack }) {
    const [newUsername, setNewUsername] = useState(user.username);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNameChange = async () => {
        if(!newUsername || newUsername === user.username) return;

        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${SOCKET_URL}/api/users/${user.userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newUsername: newUsername, newProfilePictureUrl: user.profilePictureUrl })
            });
            const updatedUser = await response.json();
            if (!response.ok) throw new Error('Update profil gagal.');
            onProfileUpdated(updatedUser);
            alert('Username berhasil diperbarui!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <button onClick={onBack} className="back-button">← Kembali ke Chat</button>
            <h2>Profil Anda</h2>
            <img src={user.profilePictureUrl || 'https://via.placeholder.com/120'} alt="Avatar" className="profile-avatar" />
            <p>Ganti username:</p>
            <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            <button onClick={handleNameChange} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Nama'}</button>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

// ===================================================================
// KOMPONEN CHAT UTAMA
// ===================================================================
function ChatPage({ user, onLogout, onNavigateToProfile }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    socket.emit('user_online', { userId: user.userId, username: user.username });

    socket.on('chat_history', (history) => setMessages(history));
    socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('online_users_list', (users) => setOnlineUsers(users));
    socket.on('message_updated', (updatedMsg) => {
      setMessages(prev => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
    });

    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
      socket.off('online_users_list');
      socket.off('message_updated');
    };
  }, [user.userId, user.username]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        userId: user.userId,
        username: user.username,
        message: newMessage,
        isModerator: user.isModerator,
      };
      socket.emit('send_message', messageData);
      setNewMessage('');
    }
  };
  
  const handleDeleteMessage = (messageId) => {
      socket.emit('delete_message', { messageId, userId: user.userId, isModerator: user.isModerator });
  };
  
  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="chat-layout">
      <div className="sidebar">
        <div className="profile-summary">
            <img src={user.profilePictureUrl || 'https://via.placeholder.com/80'} alt="Avatar" />
            <h4>{user.username}</h4>
            <div className="profile-actions">
                <button onClick={onNavigateToProfile}>Profil</button>
                <button onClick={onLogout}>Keluar</button>
            </div>
        </div>
        <div className="online-users">
          <h4>Online ({onlineUsers.length})</h4>
          <ul>
            {onlineUsers.map(userId => <li key={userId}>User {userId}</li>)}
          </ul>
        </div>
      </div>
      <div className="chat-main">
        <div className="chat-body" ref={chatBodyRef}>
          {messages.map(msg => (
            <div key={msg._id} className={`message-bubble ${msg.senderId === user.userId ? 'self' : ''}`}>
              <div className="message-header">
                <span style={{ color: msg.isModerator ? '#ff5e57' : '#0fb9b1', fontWeight: 'bold' }}>
                  {msg.senderUsername}
                  {msg.isModerator && ' (Mod)'}
                </span>
                <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
              </div>
              <p className="message-text">{msg.message}</p>
              {(msg.senderId === user.userId || user.isModerator) && !msg.isDeleted &&
                <button className="delete-button" onClick={() => handleDeleteMessage(msg._id)}>Hapus</button>
              }
            </div>
          ))}
        </div>
        <div className="chat-footer">
          <input type="text" value={newMessage} placeholder="Ketik pesan..." onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
          <button onClick={handleSendMessage}>Kirim</button>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// KOMPONEN UTAMA APP (PENGATUR)
// ===================================================================
function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setView('chat');
  };

  const handleProfileUpdated = (updatedUser) => {
      setUser(updatedUser);
  };

  const handleLogout = () => {
    socket.emit('user_offline', user.userId);
    setUser(null);
    setView('login');
  };

  const renderView = () => {
    switch (view) {
      case 'chat':
        return <ChatPage user={user} onLogout={handleLogout} onNavigateToProfile={() => setView('profile')} />;
      case 'profile':
        return <ProfilePage user={user} onProfileUpdated={handleProfileUpdated} onBack={() => setView('chat')} />;
      default:
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return <div className="App">{renderView()}</div>;
}

export default App;
