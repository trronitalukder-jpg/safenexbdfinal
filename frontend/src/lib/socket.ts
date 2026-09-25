import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const SOCKET_URL =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
        : process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 15000,
      auth: (cb) => {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('safnexbd_token') || localStorage.getItem('safnexbd_token')
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

if (typeof window !== 'undefined') {
  // 1. W3C Page Lifecycle API: Freeze event (called before entering Back-Forward Cache)
  document.addEventListener('freeze', () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });

  // 2. Pagehide event (fallback for browsers not yet supporting freeze)
  window.addEventListener('pagehide', (event) => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });

  // 3. Resume event (called when restored from Back-Forward Cache)
  document.addEventListener('resume', () => {
    if (socket && !socket.connected) {
      socket.connect();
    }
  });

  // 4. Pageshow event (handles persisted bfcache restores)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && socket && !socket.connected) {
      socket.connect();
    }
  });

  // 5. Visibility change handler: reconnect smoothly when tab becomes active again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && socket && !socket.connected) {
      socket.connect();
    }
  });
}
