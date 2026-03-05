'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: process.env.NEXT_PUBLIC_TURN_URL || 'turn:turn.e-consult.ma:3478',
    username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
    credential: process.env.NEXT_PUBLIC_TURN_PASSWORD || '',
  },
];

interface UseWebRTCProps {
  socket: Socket | null;
  roomId: string;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

export function useWebRTC({
  socket,
  roomId,
  localVideoRef,
  remoteVideoRef,
}: UseWebRTCProps) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [remoteParticipant, setRemoteParticipant] = useState<any>(null);

  const createPeerConnection = useCallback(
    (targetSocketId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            targetSocketId,
          });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      peerConnectionRef.current = pc;
      return pc;
    },
    [socket, remoteVideoRef],
  );

  const startLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, [localVideoRef]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        socket?.emit('media-toggle', { roomId, video: videoTrack.enabled, audio: isAudioEnabled });
      }
    }
  }, [socket, roomId, isAudioEnabled]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        socket?.emit('media-toggle', { roomId, video: isVideoEnabled, audio: audioTrack.enabled });
      }
    }
  }, [socket, roomId, isVideoEnabled]);

  const hangUp = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setIsConnected(false);
    socket?.emit('leave-room', { roomId });
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('user-joined', async ({ socketId, ...participant }) => {
      setRemoteParticipant({ socketId, ...participant });
      const pc = createPeerConnection(socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { roomId, offer, targetSocketId: socketId });
    });

    socket.on('offer', async ({ offer, fromSocketId }) => {
      const pc = createPeerConnection(fromSocketId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { answer, targetSocketId: fromSocketId });
    });

    socket.on('answer', async ({ answer }) => {
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (candidate && peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      }
    });

    socket.on('user-left', () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setIsConnected(false);
      setRemoteParticipant(null);
    });

    return () => {
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
    };
  }, [socket, createPeerConnection, remoteVideoRef, roomId]);

  return {
    startLocalStream,
    toggleVideo,
    toggleAudio,
    hangUp,
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    remoteParticipant,
  };
}
