import { ref, computed, readonly, onMounted, onUnmounted } from 'vue';
import { ChatService } from '~/services/ChatService';
import type { ChatMessage, Chat, ChatsResponse } from '~/types/chat';
import type { PusherMessageSentEvent, PusherMessageReadEvent } from '~/types/pusher';
import { PUSHER_EVENTS, PUSHER_CHANNELS } from '~/config/pusher-events';

export const useChatManager = () => {
  // Reactive states
  const chats = ref<Chat[]>([]);
  const currentChat = ref<Chat | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref<any>(null);

  // Current user
  const currentUser = useAuth().user;

  // Get runtime config for API URLs
  const config = useRuntimeConfig();
  const chatBaseUrl = config.public.chatApiUrl as string;

  // Service instance
  const chatService = new ChatService(chatBaseUrl);

  /**
   * Load chats
   */
  const loadChats = async (page: number = 1): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ChatsResponse = await chatService.getChats(page);
      console.log(response);
      chats.value = response.chats || [];
      pagination.value = response.pagination;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load chats';
      console.error('Load chats error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Start chat with user
   */
  const startChatWithUser = async (userId: number, userType: 'user' | 'admin' = 'user') => {
    loading.value = true;
    error.value = null;

    try {
      const chat = await chatService.createPrivateChat(userId, userType);
      console.log('🚀 Chat created:', chat);
      
      // Check if chat has ID
      if (!chat || !chat.id) {
        throw new Error('Chat created without valid ID');
      }
      
      // Add to chats list if doesn't exist
      const existingChat = chats.value.find(c => c.id === chat.id);
      if (!existingChat) {
        chats.value.unshift(chat);
      }

      // Set as current chat
      currentChat.value = chat;
      console.log('🎯 CurrentChat set:', currentChat.value);

      // Set up Pusher listener for the new chat
      await setupPusherListenerForChat(chat.id);

      // Return created chat
      return chat;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start chat';
      console.error('Start chat error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Carregar mensagens de um chat
   */
  const loadChatMessages = async (chatId: number, page: number = 1) => {
    console.log('📥 loadChatMessages chamado para chat ID:', chatId);
    loading.value = true;
    error.value = null;

    try {
      const response = await chatService.getChatMessages(chatId, page);
      console.log('📥 getChatMessages response:', response);
      console.log('📥 Messages array:', response.messages);
      console.log('📥 Messages length:', response.messages?.length);
      
      if (page === 1) {
        messages.value = response.messages;
        console.log('📥 Messages set:', messages.value);
      } else {
        // For pagination, add messages at the beginning
        messages.value.unshift(...response.messages);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load messages';
      console.error('Load chat messages error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Enviar mensagem para chat atual
   */
  const sendMessage = async (content: string) => {
    console.log('📤 Attempting to send message:', { currentChat: currentChat.value, content });
    
    if (!currentChat.value || !currentChat.value.id || !content.trim()) {
      console.error('Send message error: currentChat or chat ID is undefined', currentChat.value);
      return;
    }

    try {
      console.log('📤 Sending message to chat ID:', currentChat.value.id);
      const message = await chatService.sendMessageToChat(currentChat.value.id, content);
      
      // Do NOT add message to list locally
      // Let Pusher handle the insertion to avoid formatting issues
      // messages.value.push(message);
      
      // Update last message in conversation
      if (currentChat.value) {
        currentChat.value.last_message = message;
        currentChat.value.unread_count = 0;
      }

      return message;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Send message error:', err);
      throw err;
    }
  };

  /**
   * Send message to specific user
   */
  const sendMessageToUser = async (content: string, userId: number, userType: 'user' | 'admin' = 'user') => {
    try {
      const response = await chatService.sendMessageToUser(content, userId, userType);
      
      // Add chat to list if doesn't exist
      const existingChat = chats.value.find(c => c.id === response.chat.id);
      if (!existingChat) {
        chats.value.unshift(response.chat);
      }

      // Set as current chat
      currentChat.value = response.chat;

      // Do NOT add message to list locally
      // Let Pusher handle the insertion to avoid formatting issues
      // messages.value.push(response.message);

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Send message to user error:', err);
      throw err;
    }
  };

  /**
   * Selecionar chat
   */
  const selectChat = async (chat: Readonly<Chat>) => {
    console.log('🎯 selectChat called with:', chat);
    console.log('🎯 Chat ID:', chat.id);
    
    currentChat.value = { 
      ...chat
    } as Chat;
    
    console.log('🎯 CurrentChat set:', currentChat.value);

    // Load chat messages
    await loadChatMessages(chat.id);
    
    // Set up Pusher listener for selected chat if not already configured
    await setupPusherListenerForChat(chat.id);
  };

  /**
   * Formatar nome do chat para exibição
   */
  const getChatDisplayName = (chat: Chat): string => {
    return chatService.getChatDisplayName(chat);
  };

  /**
   * Format message for display
   */
  const formatMessage = (message: ChatMessage) => {
    return chatService.formatMessage(message);
  };

  /**
   * Check if message is own
   */
  const isOwnMessage = (message: ChatMessage): boolean => {
    return message.sender_id === currentUser.value?.id;
  };

  /**
   * Get unread chats
   */
  const unreadChats = computed(() => {
    return chats.value.filter(chat => chat.unread_count > 0);
  });

  /**
   * Total de mensagens não lidas
   */
  const totalUnread = computed(() => {
    return chats.value.reduce((total, chat) => total + chat.unread_count, 0);
  });

  /**
   * Mensagens formatadas
   */
  const formattedMessages = computed(() => {
    console.log('🎨 formattedMessages computed chamada');
    console.log('🎨 messages.value:', messages.value);
    console.log('🎨 messages.value.length:', messages.value.length);
    
    const formatted = messages.value.map(message => formatMessage(message));
    console.log('🎨 formatted result:', formatted);
    
    return formatted;
  });

  /**
   * Set up Pusher listener for new messages
   */
  const setupPusherListener = () => {
    try {
      console.log('🔔 setupPusherListener started');
      
      // Get Pusher instance from plugin
      const { $pusher } = useNuxtApp();
      console.log('🔔 Pusher obtained:', $pusher);
      
      if (!$pusher) {
        console.warn('⚠️ Pusher not available for listener');
        return;
      }

      console.log('🔔 Configuring Pusher listener for new messages...');

      // Listen to chat channels for messages
      const currentUser = useAuth().user.value;
      console.log('🔔 Current user:', currentUser);
      
      if (currentUser?.id) {
        console.log('🔔 Available chats to configure listener:', chats.value);
        
        // Listen to all user chats
        chats.value.forEach(chat => {
          // Check if listener already exists for this chat
          const channelName = PUSHER_CHANNELS.CHAT(chat.id);
          console.log('🔔 Configuring listener for channel:', channelName);

          try {
            // Check if already subscribed to channel
            if ($pusher.channel(channelName)) {
              console.log(`🔔 Already subscribed to channel ${channelName}, skipping...`);
              return;
            }

            const channel = $pusher.subscribe(channelName);
            console.log('🔔 Channel subscribed:', channel);
            
            channel.bind(PUSHER_EVENTS.MESSAGE_SENT, (event: PusherMessageSentEvent) => {
              console.log('🔔 Nova mensagem recebida via Pusher:', event);
              
              // Tratar data de forma mais robusta
              let createdAt = event.created_at;
              try {
                if (createdAt) {
                  const date = new Date(createdAt);
                  if (isNaN(date.getTime())) {
                    console.warn('⚠️ Data inválida recebida do Pusher:', createdAt);
                    createdAt = new Date().toISOString(); // Usar data atual como fallback
                  }
                }
              } catch (err) {
                console.warn('⚠️ Erro ao processar data do Pusher:', err);
                createdAt = new Date().toISOString(); // Usar data atual como fallback
              }
              
              const newMessage: ChatMessage = {
                id: event.id,
                chat_id: event.chat_id,
                content: event.content,
                sender_id: event.sender_id,
                sender_type: event.sender_type,
                message_type: 'text', // Padrão para mensagens de texto
                metadata: null,
                is_read: event.is_read,
                read_at: null,
                created_at: createdAt,
                updated_at: createdAt
              };

              // Adicionar mensagem ao estado
              messages.value.push(newMessage);
              console.log('🔔 Mensagem adicionada ao estado:', newMessage);

              // Atualizar último mensagem no chat correspondente
              const chatIndex = chats.value.findIndex(c => c.id === event.chat_id);
              if (chatIndex !== -1) {
                chats.value[chatIndex].last_message = newMessage;
                chats.value[chatIndex].unread_count = (chats.value[chatIndex].unread_count || 0) + 1;
                console.log('🔔 Chat atualizado com nova mensagem');
              }

              // Se a mensagem é para o chat atual, fazer scroll para baixo
              if (currentChat.value?.id === event.chat_id) {
                // Emit event to trigger scroll (will be caught by ChatInterface)
                window.dispatchEvent(new CustomEvent('scroll-to-bottom'));
              }
            });

            console.log(`✅ Listener configured for chat ${chat.id} on channel ${channelName}`);
          } catch (channelError) {
            console.error(`❌ Error configuring listener for chat ${chat.id}:`, channelError);
          }
        });
      } else {
        console.warn('⚠️ User not authenticated, cannot configure listener');
      }

      // TODO: Implementar listener para mensagens lidas quando necessário
      // .listen(PUSHER_EVENTS.MESSAGE_READ, (event: PusherMessageReadEvent) => { ... });

      console.log('✅ Listener do Pusher configurado com sucesso');
    } catch (error) {
      console.error('❌ Error configuring Pusher listener:', error);
    }
  };

  /**
   * Set up Pusher listener for a specific chat
   */
  const setupPusherListenerForChat = async (chatId: number) => {
    try {
      console.log(`🔔 setupPusherListenerForChat started for chat ID: ${chatId}`);
      const { $pusher } = useNuxtApp();

      if (!$pusher) {
        console.warn('⚠️ Pusher not available for specific chat listener');
        return;
      }

      const channelName = PUSHER_CHANNELS.CHAT(chatId);
      console.log('🔔 Configuring listener for channel:', channelName);

      const channel = $pusher.subscribe(channelName);
      console.log('🔔 Canal inscrito:', channel);

      channel.bind(PUSHER_EVENTS.MESSAGE_SENT, (event: PusherMessageSentEvent) => {
        console.log('🔔 Nova mensagem recebida via Pusher para chat:', chatId, event);
        
        // Tratar data de forma mais robusta
        let createdAt = event.created_at;
        try {
          if (createdAt) {
            const date = new Date(createdAt);
            if (isNaN(date.getTime())) {
              console.warn('⚠️ Data inválida recebida do Pusher para chat:', chatId, createdAt);
              createdAt = new Date().toISOString(); // Usar data atual como fallback
            }
          }
        } catch (err) {
          console.warn('⚠️ Erro ao processar data do Pusher para chat:', chatId, err);
          createdAt = new Date().toISOString(); // Usar data atual como fallback
        }
        
        const newMessage: ChatMessage = {
          id: event.id,
          chat_id: event.chat_id,
          content: event.content,
          sender_id: event.sender_id,
          sender_type: event.sender_type,
          message_type: 'text', // Padrão para mensagens de texto
          metadata: null,
          is_read: event.is_read,
          read_at: null,
          created_at: createdAt,
          updated_at: createdAt
        };

        // Adicionar mensagem ao estado
        messages.value.push(newMessage);
        console.log('🔔 Mensagem adicionada ao estado para chat:', chatId, newMessage);

        // Atualizar última mensagem no chat correspondente
        const chatIndex = chats.value.findIndex(c => c.id === event.chat_id);
        if (chatIndex !== -1) {
          chats.value[chatIndex].last_message = newMessage;
          chats.value[chatIndex].unread_count = (chats.value[chatIndex].unread_count || 0) + 1;
          console.log('🔔 Chat atualizado com nova mensagem para chat:', chatId);
        }

        // Se a mensagem é para o chat atual, fazer scroll para baixo
        if (currentChat.value?.id === event.chat_id) {
          // Emitir evento para fazer scroll (será capturado pelo ChatInterface)
          window.dispatchEvent(new CustomEvent('scroll-to-bottom'));
        }
      });

      console.log(`✅ Pusher listener successfully configured for chat ${chatId}`);
    } catch (error) {
      console.error(`❌ Error configuring Pusher listener for chat ${chatId}:`, error);
    }
  };

  /**
   * Test Pusher connection
   */
  const testPusherConnection = () => {
    try {
      console.log('🧪 Testing Pusher connection...');
      
      const { $pusher } = useNuxtApp();
      if (!$pusher) {
        console.error('❌ Pusher not available for test');
        return;
      }

      // Test connection with a public channel
      const testChannel = $pusher.subscribe('test-channel');
      
      testChannel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ Connected to test channel');
        console.log('✅ Connection ID:', $pusher.connection.connection.id);
      });

      testChannel.bind('pusher:subscription_error', (status: any) => {
        console.error('❌ Subscription error:', status);
      });

      console.log('🧪 Connection test started');
    } catch (error) {
      console.error('❌ Connection test error:', error);
    }
  };

  /**
   * Clean up Pusher listener
   */
  const cleanupPusherListener = () => {
    try {
      const { $pusher } = useNuxtApp();
      
      if ($pusher) {
        console.log('🔔 Cleaning up Pusher listener...');
        // Pusher automatically cleans up listeners when disconnecting
        $pusher.disconnect();
      }
    } catch (error) {
      console.error('❌ Error cleaning up Pusher listener:', error);
    }
  };

  // Set up Pusher listener when composable is mounted
  onMounted(() => {
    console.log('🚀 useChatManager - onMounted called');
    console.log('🚀 Available chats:', chats.value);
    console.log('🚀 Current user:', currentUser.value);
    
    // Wait a bit to ensure chats have been loaded
    setTimeout(() => {
      console.log('🚀 Executing setupPusherListener after delay');
      setupPusherListener();
    }, 1000);
  });

  // Clean up listener when composable is unmounted
  onUnmounted(() => {
    cleanupPusherListener();
  });

  return {
    // Estados
    chats: readonly(chats) as ComputedRef<Chat[]>,
    currentChat: readonly(currentChat),
    messages: readonly(messages),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),

    // Computed
    unreadChats,
    totalUnread,
    formattedMessages,
    currentUser,

    // Funções
    loadChats,
    startChatWithUser,
    loadChatMessages,
    sendMessage,
    sendMessageToUser,
    selectChat,
    getChatDisplayName,
    formatMessage,
    isOwnMessage,
    testPusherConnection,
    setupPusherListenerForChat
  };
}; 