// Singleton instance for Socket.io
// This file exists to prevent circular dependencies
let ioInstance = null;

export const setIoInstance = (io) => {
  ioInstance = io;
  console.log("[Socket Instance] Socket.io instance set successfully");
};

export const getIoInstance = () => {
  if (!ioInstance) {
    throw new Error(
      "Socket.io instance not initialized. Call setIoInstance first."
    );
  }
  return ioInstance;
};
