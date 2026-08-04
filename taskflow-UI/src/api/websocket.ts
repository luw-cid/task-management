import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "./axios";
import type { WebSocketMessage } from "../types";

if (typeof window !== "undefined" && !(window as any).global) {
  (window as any).global = window;
}

const DEFAULT_API_URL = "http://localhost:8080/api";
const getBaseWsUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
  return apiUrl.replace(/\/+api\/?$/, "").replace(/\/+$/, "") + "/ws";
};

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private subscriptions: Map<string, any> = new Map();

  public connect(onConnected?: () => void, onError?: (err: any) => void) {
    if (this.client && this.isConnected) {
      if (onConnected) onConnected();
      return;
    }

    const token = getAccessToken();

    this.client = new Client({
      webSocketFactory: () => new SockJS(getBaseWsUrl()),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: (str) => {
        if (import.meta.env.DEV) {
          // System debug log
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.isConnected = true;
      if (onConnected) onConnected();
    };

    this.client.onStompError = (frame) => {
      this.isConnected = false;
      if (onError) onError(frame);
    };

    this.client.activate();
  }

  public subscribeToTask(
    taskId: number,
    callback: (message: WebSocketMessage<any>) => void
  ) {
    const topic = `/topic/task/${taskId}/comments`;
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    if (!this.client || !this.isConnected) {
      this.connect(() => {
        this.doSubscribe(topic, callback);
      });
      return () => this.unsubscribe(topic);
    }

    this.doSubscribe(topic, callback);
    return () => this.unsubscribe(topic);
  }

  public subscribeToBoard(
    boardId: number,
    callback: (message: WebSocketMessage<any>) => void
  ) {
    const topic = `/topic/board/${boardId}`;
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    if (!this.client || !this.isConnected) {
      this.connect(() => {
        this.doSubscribe(topic, callback);
      });
      return () => this.unsubscribe(topic);
    }

    this.doSubscribe(topic, callback);
    return () => this.unsubscribe(topic);
  }

  private doSubscribe(
    topic: string,
    callback: (message: WebSocketMessage<any>) => void
  ) {
    if (!this.client) return;

    const sub = this.client.subscribe(topic, (stompMessage) => {
      try {
        const payload: WebSocketMessage<any> = JSON.parse(stompMessage.body);
        callback(payload);
      } catch (err) {
        // Parse error
      }
    });

    this.subscriptions.set(topic, sub);
  }

  public unsubscribe(topic: string) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  public disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const websocketService = new WebSocketService();
