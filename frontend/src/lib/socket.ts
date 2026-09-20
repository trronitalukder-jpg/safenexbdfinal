import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: (cb) => {
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('safnexbd_token') || localStorage.getItem('safnexbd_token'))
          : null;
        cb({ token });
      },
    });
  }
  return socket;
};

export const reconnectSocket = (): Socket => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket();
};


