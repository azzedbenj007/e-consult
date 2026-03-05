'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useWebRTC } from '@/hooks/useWebRTC';

interface VideoRoomProps {
  roomId: string;
}

export function VideoRoom({ roomId }: VideoRoomProps) {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const {
    startLocalStream,
    toggleVideo,
    toggleAudio,
    hangUp,
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    remoteParticipant,
  } = useWebRTC({ socket, roomId, localVideoRef, remoteVideoRef });

  // Duration timer
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (!accessToken || !user) return;

    const s = getSocket(accessToken);
    setSocket(s);

    s.on('chat-message', (msg: any) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    startLocalStream().then(() => {
      s.emit('join-room', { roomId, name: `${user.firstName} ${user.lastName}` });
    });

    return () => {
      s.off('chat-message');
      disconnectSocket();
    };
  }, [accessToken, user, roomId, startLocalStream]);

  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || !socket) return;
    socket.emit('chat-message', { roomId, message: chatInput });
    setChatMessages((prev) => [
      ...prev,
      { fromSelf: true, message: chatInput, timestamp: new Date().toISOString() },
    ]);
    setChatInput('');
  }, [chatInput, socket, roomId]);

  const handleHangUp = () => {
    hangUp();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">
            {isConnected
              ? `Connecté — ${formatDuration(callDuration)}`
              : remoteParticipant
              ? 'Connexion...'
              : 'En attente du médecin...'}
          </span>
        </div>
        <div className="text-gray-400 text-sm">
          Salle : {roomId.slice(0, 12)}...
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className="flex-1 p-4">
          <div className="video-grid h-full max-h-[calc(100vh-180px)]">
            {/* Remote video */}
            <div className="video-container relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                      👨‍⚕️
                    </div>
                    <p className="text-sm opacity-75">
                      {remoteParticipant ? 'Connexion en cours...' : 'En attente de votre médecin'}
                    </p>
                  </div>
                </div>
              )}
              {remoteParticipant && (
                <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                  {remoteParticipant.name}
                </div>
              )}
            </div>

            {/* Local video */}
            <div className="video-container relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                    {user?.firstName?.[0]}
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                Vous {!isAudioEnabled && '(muet)'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${
                isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 text-white'
              }`}
              title={isAudioEnabled ? 'Couper le micro' : 'Activer le micro'}
            >
              {isAudioEnabled ? '🎤' : '🔇'}
            </button>
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${
                isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 text-white'
              }`}
              title={isVideoEnabled ? 'Couper la caméra' : 'Activer la caméra'}
            >
              {isVideoEnabled ? '📷' : '🚫'}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center text-xl"
              title="Chat"
            >
              💬
            </button>
            <button
              onClick={handleHangUp}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-2xl shadow-lg"
              title="Raccrocher"
            >
              📵
            </button>
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-medium">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.fromSelf ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      msg.fromSelf ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-700 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm outline-none"
                placeholder="Message..."
              />
              <button
                onClick={sendChatMessage}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                Envoyer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
