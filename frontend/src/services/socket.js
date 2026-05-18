import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;
  socket = io(window.location.origin, {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
  });
  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
