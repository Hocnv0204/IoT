import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.subscribers = [];
  }

  connect(onConnected, onError) {
    const socket = new SockJS('http://localhost:8080/websocket');
    this.stompClient = Stomp.over(socket);
    
    // Enable debug logs
    this.stompClient.debug = (str) => {
      console.log(str);
    };

    this.stompClient.connect({}, 
      (frame) => {
        console.log('Connected: ' + frame);
        if (onConnected) onConnected();
        this.subscribeToEvents();
      }, 
      (error) => {
        console.error('Connection error:', error);
        if (onError) onError(error);
        // Auto reconnect after 5 seconds
        setTimeout(() => this.connect(onConnected, onError), 5000);
      }
    );
  }

  subscribeToEvents() {
    if (this.stompClient && this.stompClient.connected) {
      // Subscribe to Check-in events
      this.stompClient.subscribe('/topic/checkin', (message) => {
        console.log("Received raw checkin message:", message.body);
        try {
          const payload = JSON.parse(message.body);
          console.log("Parsed checkin payload:", payload);
          // Normalize data: Handle both nested 'data' and flat structure
          const data = payload.data || payload;
          const eventData = { 
            ...data, 
            type: 'CHECK_IN',
            message: payload.message 
          };
          this.notifySubscribers(eventData);
        } catch (e) {
          console.error("Error parsing checkin message:", e);
        }
      });

      // Subscribe to Check-out events
      this.stompClient.subscribe('/topic/checkout', (message) => {
        console.log("Received raw checkout message:", message.body);
        try {
          const payload = JSON.parse(message.body);
          console.log("Parsed checkout payload:", payload);
          
          const data = payload.data || payload;
          const eventData = { 
            ...data, 
            type: 'CHECK_OUT', 
            message: payload.message 
          };
          this.notifySubscribers(eventData);
        } catch (e) {
          console.error("Error parsing checkout message:", e);
        }
      });

      // Subscribe to Error Notifications
      this.stompClient.subscribe('/topic/error-notification', (message) => {
        console.log("Received raw error notification:", message.body);
        try {
          const payload = JSON.parse(message.body);
          console.log("Parsed error payload:", payload);
          
          const eventData = { 
            ...payload,
            type: 'ERROR_NOTIFICATION'
          };
          this.notifySubscribers(eventData);
        } catch (e) {
          console.error("Error parsing error notification:", e);
        }
      });
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers(data) {
    this.subscribers.forEach(callback => callback(data));
  }

  disconnect() {
    if (this.stompClient !== null && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log("Disconnected");
      });
    } else if (this.stompClient !== null) {
      // If client exists but not connected (e.g. connecting), just nullify it or close socket manually if possible
      // Stompjs disconnect might throw if not connected.
      try {
         this.stompClient.disconnect(() => console.log("Disconnected (force)"));
      } catch (e) {
         console.log("Disconnect error (ignored):", e);
      }
    }
  }
  // --- ESP32 WebSocket Handling ---
  connectToEsp32(ip, onOpen, onMessage, onClose) {
    if (this.esp32Socket) {
      this.esp32Socket.close();
    }

    const url = `ws://${ip}:81`;
    console.log(`[ESP32] Connecting to ${url}...`);
    
    this.esp32Socket = new WebSocket(url);
    this.esp32Socket.binaryType = "arraybuffer"; // Important for video stream

    this.esp32Socket.onopen = () => {
      console.log("[ESP32] Connected!");
      if (onOpen) onOpen();
    };

    this.esp32Socket.onmessage = (event) => {


  if (typeof event.data === "string") {
    // Nếu là chuỗi UID (>= 8 hex)
    if (/^[0-9A-Fa-f]{8,}$/.test(event.data)) {
      if (onMessage) onMessage({ type: "RFID_SCANNED", rfid: event.data });
      return;
    }

    // Nếu là JSON
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
      return;
    } catch (_) {
      console.warn("[ESP32] Unknown text:", event.data);
    }
  }

  // Binary frame (camera)
  if (event.data instanceof ArrayBuffer) {
    if (onMessage) onMessage({ type: "VIDEO_FRAME", buffer: event.data });
  }
};


    this.esp32Socket.onclose = () => {
      console.log("[ESP32] Disconnected");
      if (onClose) onClose();
    };

    this.esp32Socket.onerror = (error) => {
      console.error("[ESP32] Error:", error);
    };
  }

  disconnectEsp32() {
    if (this.esp32Socket) {
      this.esp32Socket.close();
      this.esp32Socket = null;
    }
  }
}

export const websocketService = new WebSocketService();
