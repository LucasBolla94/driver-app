import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import LiveChatScreen from './LiveChatScreen';

interface SupportScreenProps {
  onBack?: () => void;
}

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'closed';
  created_at: string;
  lastMessage?: string;
  unreadCount?: number;
}

export default function SupportScreen({ onBack }: SupportScreenProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // TODO: Fetch from Supabase support_tickets table
      // For now, using mock data
      const mockTickets: Ticket[] = [
        {
          id: '1',
          subject: 'Payment Issue',
          status: 'open',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lastMessage: 'I have not received my payment for last week',
          unreadCount: 2,
        },
        {
          id: '2',
          subject: 'App Crash on Delivery',
          status: 'open',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          lastMessage: 'The app keeps crashing when I try to complete delivery',
          unreadCount: 0,
        },
        {
          id: '3',
          subject: 'Account Verification',
          status: 'closed',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastMessage: 'Thank you for helping me verify my account',
          unreadCount: 0,
        },
      ];

      setTickets(mockTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    // Create new ticket and open chat
    setSelectedTicketId('new');
  };

  const handleTicketPress = (ticketId: string) => {
    setSelectedTicketId(ticketId);
  };

  const handleCloseLiveChat = () => {
    setSelectedTicketId(null);
    fetchTickets(); // Refresh tickets after closing chat
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) {
      return `${diffInMins}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  const getFilteredTickets = () => {
    if (activeFilter === 'all') return tickets;
    return tickets.filter(ticket => ticket.status === activeFilter);
  };

  if (selectedTicketId) {
    return (
      <LiveChatScreen
        ticketId={selectedTicketId}
        onBack={handleCloseLiveChat}
      />
    );
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>Support</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* New Chat Button */}
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleNewChat}
          activeOpacity={0.7}
        >
          <View style={styles.newChatIconContainer}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.newChatTextContainer}>
            <Text style={styles.newChatTitle}>Start New Chat</Text>
            <Text style={styles.newChatSubtitle}>Get help from our support team</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#000000" />
        </TouchableOpacity>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'all' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'open' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('open')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'open' && styles.filterTabTextActive,
              ]}
            >
              Open
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'closed' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('closed')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'closed' && styles.filterTabTextActive,
              ]}
            >
              Closed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tickets List */}
        <View style={styles.ticketsContainer}>
          <Text style={styles.sectionTitle}>Your Tickets</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
            </View>
          ) : getFilteredTickets().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No tickets found</Text>
              <Text style={styles.emptySubtext}>
                {activeFilter === 'all'
                  ? 'Start a new chat to get support'
                  : `No ${activeFilter} tickets`}
              </Text>
            </View>
          ) : (
            <View style={styles.ticketsList}>
              {getFilteredTickets().map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() => handleTicketPress(ticket.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.ticketLeft}>
                    <View
                      style={[
                        styles.ticketStatusDot,
                        ticket.status === 'open'
                          ? styles.ticketStatusDotOpen
                          : styles.ticketStatusDotClosed,
                      ]}
                    />
                    <View style={styles.ticketInfo}>
                      <View style={styles.ticketHeader}>
                        <Text style={styles.ticketSubject} numberOfLines={1}>
                          {ticket.subject}
                        </Text>
                        {ticket.unreadCount && ticket.unreadCount > 0 ? (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>
                              {ticket.unreadCount}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {ticket.lastMessage && (
                        <Text style={styles.ticketMessage} numberOfLines={1}>
                          {ticket.lastMessage}
                        </Text>
                      )}
                      <Text style={styles.ticketTime}>
                        {formatTimeAgo(ticket.created_at)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999999" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 16,
  },
  newChatIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatTextContainer: {
    flex: 1,
  },
  newChatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  newChatSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#000000',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  ticketsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Poppins',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Poppins',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'Poppins',
    marginTop: 8,
    textAlign: 'center',
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  ticketStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ticketStatusDotOpen: {
    backgroundColor: '#4CAF50',
  },
  ticketStatusDotClosed: {
    backgroundColor: '#999999',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  ticketMessage: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  ticketTime: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Poppins',
  },
});
