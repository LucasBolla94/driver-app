import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface LiveChatScreenProps {
  ticketId: string;
  onBack?: () => void;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: 'driver' | 'support';
  message: string;
  created_at: string;
  read: boolean;
}

export default function LiveChatScreen({ ticketId, onBack }: LiveChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [ticketSubject, setTicketSubject] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    initializeChat();

    return () => {
      // Cleanup: Unsubscribe from realtime channel
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  const initializeChat = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      if (ticketId === 'new') {
        // Create new ticket
        await createNewTicket(user.id);
      } else {
        // Load existing ticket
        await loadTicket();
        await loadMessages();
        subscribeToMessages();
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const createNewTicket = async (userId: string) => {
    try {
      // TODO: Create ticket in Supabase support_tickets table
      // For now, using mock data
      setTicketSubject('New Support Request');

      const welcomeMessage: Message = {
        id: 'welcome',
        ticket_id: ticketId,
        sender_type: 'support',
        message: 'Hello! How can we help you today?',
        created_at: new Date().toISOString(),
        read: true,
      };

      setMessages([welcomeMessage]);

      // After creating ticket in DB, subscribe to realtime
      // subscribeToMessages();
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', 'Failed to create ticket');
    }
  };

  const loadTicket = async () => {
    try {
      // TODO: Fetch ticket details from Supabase
      // For now, using mock data
      setTicketSubject('Payment Issue');
    } catch (error) {
      console.error('Error loading ticket:', error);
    }
  };

  const loadMessages = async () => {
    try {
      // TODO: Fetch messages from Supabase support_messages table
      // For now, using mock data
      const mockMessages: Message[] = [
        {
          id: '1',
          ticket_id: ticketId,
          sender_type: 'driver',
          message: 'I have not received my payment for last week',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: '2',
          ticket_id: ticketId,
          sender_type: 'support',
          message: 'Thank you for contacting us. Let me check your payment status.',
          created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: '3',
          ticket_id: ticketId,
          sender_type: 'support',
          message: 'I can see your payment is scheduled for processing tomorrow. You should receive it within 24 hours.',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
      ];

      setMessages(mockMessages);

      // Mark messages as read
      // await markMessagesAsRead();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    // Subscribe to realtime changes in support_messages table
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;

          setMessages((prevMessages) => [...prevMessages, newMessage]);

          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // TODO: Insert message into Supabase support_messages table
      // For now, adding to local state
      const newMessage: Message = {
        id: Date.now().toString(),
        ticket_id: ticketId,
        sender_type: 'driver',
        message: messageText,
        created_at: new Date().toISOString(),
        read: false,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      /*
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'driver',
          message: messageText,
          sender_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
      }
      */
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isDriver = item.sender_type === 'driver';

    return (
      <View
        style={[
          styles.messageContainer,
          isDriver ? styles.messageContainerDriver : styles.messageContainerSupport,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isDriver ? styles.messageBubbleDriver : styles.messageBubbleSupport,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isDriver ? styles.messageTextDriver : styles.messageTextSupport,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isDriver ? styles.messageTimeDriver : styles.messageTimeSupport,
            ]}
          >
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{ticketSubject}</Text>
          <Text style={styles.headerSubtitle}>Support Chat</Text>
        </View>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#999999"
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.7}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  messageContainerDriver: {
    alignSelf: 'flex-end',
  },
  messageContainerSupport: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
  },
  messageBubbleDriver: {
    backgroundColor: '#000000',
    borderBottomRightRadius: 4,
  },
  messageBubbleSupport: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  messageTextDriver: {
    color: '#FFFFFF',
  },
  messageTextSupport: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Poppins',
  },
  messageTimeDriver: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeSupport: {
    color: '#999999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins',
    color: '#000000',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
});
