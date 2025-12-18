import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Whiteboard from './components/whiteboard';
import Prompt from './components/prompt';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'], // forces WebSocket only
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Whiteboard.ai</h1>
      <p>{isConnected ? '🟢 Connected' : '🔴 Connecting...'}</p>
      <Whiteboard socketRef={socketRef} />
    </div>
  );
}
<Prompt />
export default App;
