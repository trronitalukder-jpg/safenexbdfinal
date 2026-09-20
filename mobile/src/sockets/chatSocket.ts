import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket: Socket | null = null;

export const getChatSocket = (userId?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      query: userId ? { userId } : {},
    });

    socket.on('connect', () => {
      console.log('Mobile Socket connected:', socket?.id);
      if (userId) {
        socket?.emit('user:join', { userId });
      }
    });

    socket.on('disconnect', () => {
      console.log('Mobile Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('Mobile Socket connect_error:', err.message);
    });
  }

  if (userId && socket.connected) {
    socket.emit('user:join', { userId });
  }

  return socket;
};

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const chatSocket = {
  connect: (userId?: string) => getChatSocket(userId),
  disconnect: () => disconnectChatSocket(),
  joinUserRoom: (userId: string) => {
    const s = getChatSocket(userId);
    s.emit('user:join', { userId });
  },
  getSocket: () => socket,
};
