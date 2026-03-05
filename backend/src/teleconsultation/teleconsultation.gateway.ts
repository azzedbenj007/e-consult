import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

interface RoomParticipant {
  socketId: string;
  userId: string;
  role: string;
  name: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/teleconsultation',
})
export class TeleconsultationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TeleconsultationGateway.name);
  private rooms = new Map<string, RoomParticipant[]>();
  private socketToRoom = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.data.email = payload.email;

      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const roomId = this.socketToRoom.get(client.id);
    if (roomId) {
      this.leaveRoom(client, roomId);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; name: string },
  ) {
    const { roomId, name } = data;

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, []);
    }

    const room = this.rooms.get(roomId)!;

    // Max 2 participants per room (patient + doctor)
    if (room.length >= 2) {
      client.emit('room-full', { message: 'Room is at capacity' });
      return;
    }

    const participant: RoomParticipant = {
      socketId: client.id,
      userId: client.data.userId,
      role: client.data.role,
      name,
    };

    room.push(participant);
    this.socketToRoom.set(client.id, roomId);
    client.join(roomId);

    // Notify others in room
    client.to(roomId).emit('user-joined', {
      socketId: client.id,
      userId: client.data.userId,
      role: client.data.role,
      name,
    });

    // Send current participants to the new joiner
    client.emit('room-joined', {
      roomId,
      participants: room.filter((p) => p.socketId !== client.id),
    });

    this.logger.log(`User ${client.data.userId} joined room ${roomId}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    this.leaveRoom(client, data.roomId);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; offer: RTCSessionDescriptionInit; targetSocketId: string },
  ) {
    client.to(data.targetSocketId).emit('offer', {
      offer: data.offer,
      fromSocketId: client.id,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { answer: RTCSessionDescriptionInit; targetSocketId: string },
  ) {
    client.to(data.targetSocketId).emit('answer', {
      answer: data.answer,
      fromSocketId: client.id,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { candidate: RTCIceCandidate; targetSocketId: string },
  ) {
    client.to(data.targetSocketId).emit('ice-candidate', {
      candidate: data.candidate,
      fromSocketId: client.id,
    });
  }

  @SubscribeMessage('chat-message')
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; message: string },
  ) {
    client.to(data.roomId).emit('chat-message', {
      fromSocketId: client.id,
      userId: client.data.userId,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('media-toggle')
  handleMediaToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; video: boolean; audio: boolean },
  ) {
    client.to(data.roomId).emit('media-toggle', {
      fromSocketId: client.id,
      video: data.video,
      audio: data.audio,
    });
  }

  private leaveRoom(client: Socket, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const updated = room.filter((p) => p.socketId !== client.id);

    if (updated.length === 0) {
      this.rooms.delete(roomId);
    } else {
      this.rooms.set(roomId, updated);
    }

    this.socketToRoom.delete(client.id);
    client.leave(roomId);
    client.to(roomId).emit('user-left', {
      socketId: client.id,
      userId: client.data.userId,
    });

    this.logger.log(`User ${client.data.userId} left room ${roomId}`);
  }
}
