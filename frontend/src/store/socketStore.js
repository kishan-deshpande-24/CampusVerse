import { create } from 'zustand';
import { io } from 'socket.io-client';

const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],

  connect: (userId) => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket']
    });
    socket.emit('user_online', userId);
    socket.on('online_users', (users) => set({ onlineUsers: users }));
    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, onlineUsers: [] });
  }
}));

export default useSocketStore;
