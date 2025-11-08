import { ApiClient } from '~/infrastructure/http/ApiClient';
import type { 
  ChatMessage, 
  Chat, 
  ChatChannel,
  ApiResponse, 
  ChatResponse, 
  ChatCreateResponse,
  MessageResponse, 
  MessageSendResponse,
  ChatMessageResponse,
  ChatMessageSendResponse,
  ChatsResponse,
  ChatsFetchResponse,
  MessagesResponse,
  MessagesFetchResponse
} from '~/types/chat';

export class ChatRepository {
  private apiClient: ApiClient;
  private chatApiClient: ApiClient;

  constructor(chatBaseUrl?: string) {
    this.apiClient = new ApiClient();
    // Specific client for chat without /admin
    // Use provided URL or fallback to production URL
    const baseUrl = chatBaseUrl || 'https://dash3.50g.io/api';
    this.chatApiClient = new ApiClient(baseUrl);
  }

  /**
   * Send message to another user (creates/uses private chat)
   */
  async sendMessageToUser(content: string, receiverId: number, receiverType: 'user' | 'admin'): Promise<ChatMessageSendResponse> {
    try {
      const response = await this.chatApiClient.post<ChatMessageSendResponse>('/chat/send', {
        content,
        receiver_type: receiverType,
        receiver_id: receiverId,
        message_type: 'text'
      });
      return response;
    } catch (error) {
      console.error('ChatRepository - sendMessageToUser error:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Fetch conversation between two users
   */
  async getConversation(otherUserId: number, otherUserType: 'user' | 'admin', page: number = 1, perPage: number = 50): Promise<any> {
    try {
      const response = await this.chatApiClient.get<any>(`/chat/conversation?other_user_type=${otherUserType}&other_user_id=${otherUserId}&page=${page}&per_page=${perPage}`);
      console.log('🔍 ChatRepository - getConversation raw response:', response);
      return response;
    } catch (error) {
      console.error('ChatRepository - getConversation error:', error);
      throw new Error('Failed to fetch conversation');
    }
  }

  /**
   * Listar todos os chats do usuário
   */
  async getChats(page: number = 1, perPage: number = 20): Promise<any> {
    try {
      const response = await this.chatApiClient.get<any>(`/chats?page=${page}&per_page=${perPage}`);
      console.log('🔍 ChatRepository - getChats raw response:', response);
      return response;
    } catch (error) {
      console.error('ChatRepository - getChats error:', error);
      throw new Error('Failed to fetch chats');
    }
  }

  /**
   * Fetch messages from a specific chat
   */
  async getChatMessages(chatId: number, page: number = 1, perPage: number = 50): Promise<any> {
    try {
      const response = await this.chatApiClient.get<any>(`/chat/${chatId}/messages?page=${page}&per_page=${perPage}`);
      console.log('🔍 ChatRepository - getChatMessages raw response:', response);
      return response;
    } catch (error) {
      console.error('ChatRepository - getChatMessages error:', error);
      throw new Error('Failed to fetch chat messages');
    }
  }

  /**
   * Send message to a specific chat
   */
  async sendMessageToChat(chatId: number, content: string): Promise<MessageSendResponse> {
    try {
      const response = await this.chatApiClient.post<MessageSendResponse>(`/chat/${chatId}/send`, {
        content,
        message_type: 'text'
      });
      return response;
    } catch (error) {
      console.error('ChatRepository - sendMessageToChat error:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Create private chat
   */
  async createPrivateChat(otherUserId: number, otherUserType: 'user' | 'admin'): Promise<ChatCreateResponse> {
    try {
      const response = await this.chatApiClient.post<ChatCreateResponse>('/chat/create-private', {
        other_user_id: otherUserId,
        other_user_type: otherUserType
      });
      return response;
    } catch (error) {
      console.error('ChatRepository - createPrivateChat error:', error);
      throw new Error('Failed to create private chat');
    }
  }

  /**
   * Create group chat
   */
  async createGroupChat(name: string, description: string, participants: Array<{ user_id: number; user_type: 'user' | 'admin' }>): Promise<ChatCreateResponse> {
    try {
      const response = await this.chatApiClient.post<ChatCreateResponse>('/chat/create-group', {
        name,
        description,
        participants
      });
      return response;
    } catch (error) {
      console.error('ChatRepository - createGroupChat error:', error);
      throw new Error('Failed to create group chat');
    }
  }

  /**
   * Fetch available channels
   */
  async getChannels(): Promise<ChatChannel[]> {
    try {
      const response = await this.chatApiClient.get<ChatChannel[]>('/chat/channels');
      return response;
    } catch (error) {
      throw new Error('Failed to fetch chat channels');
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(channelId: number): Promise<void> {
    try {
      await this.chatApiClient.post(`/chat/channels/${channelId}/read`);
    } catch (error) {
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Buscar usuários online
   */
  async getOnlineUsers(): Promise<any[]> {
    try {
      const response = await this.chatApiClient.get<any[]>('/chat/users/online');
      return response;
    } catch (error) {
      throw new Error('Failed to fetch online users');
    }
  }
} 