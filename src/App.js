import './App.css';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

// Hubungkan ke server backend
const socket = io.connect(process.env.REACT_APP_SERVER_URL);

function App() {
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);

  const sendMessage = () => {
    if (message !== '' && user !== '') {
      const messageData = {
        user: user,
        message: message,
      };
      // Kirim pesan ke server
      socket.emit('send_message', messageData);
      // Tambahkan pesan kita sendiri ke chat log
      setChatLog((list) => [...list, { ...messageData, fromSelf: true }]);
      setMessage(''); // Kosongkan input setelah mengirim
    }
  };

  useEffect(() => {
    // Listener untuk menerima pesan dari server
    const messageListener = (data) => {
      setChatLog((list) => [...list, data]);
    };
    socket.on('receive_message', messageListener);

    // Cleanup listener saat komponen di-unmount
    return () => socket.off('receive_message', messageListener);
  }, []);


  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h2>Real-Time Chat</h2>
        </div>
        <div className="chat-body">
          {chatLog.map((content, index) => {
            return (
              <div key={index} className={content.fromSelf ? "message-self" : "message-other"}>
                <div className="message-content">
                  <p>{content.message}</p>
                </div>
                <div className="message-meta">
                  <p>{content.fromSelf ? "You" : content.user}</p>
                </div>
              </div>
            );
          })}
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
