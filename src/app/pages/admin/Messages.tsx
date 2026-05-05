import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { logger } from '../../lib/logger';
import {
  Mail, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Download,
  MailOpen,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { API_BASE } from '../../lib/env';
import { getAccessToken } from '../../lib/supabase';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'read' | 'unread';
  created_at: string;
  updated_at?: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${await getAccessToken() || ''}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to load messages');

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      logger.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleMessageStatus(messageId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'read' ? 'unread' : 'read';
      
      const response = await fetch(
        `${API_BASE}/messages/${messageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAccessToken() || ''}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!response.ok) throw new Error('Failed to update message');

      await loadMessages();
    } catch (error) {
      logger.error('Failed to update message:', error);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(
        `${API_BASE}/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${await getAccessToken() || ''}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete message');

      await loadMessages();
      if (selectedMessage?.id === messageId) {
        setShowModal(false);
        setSelectedMessage(null);
      }
    } catch (error) {
      logger.error('Failed to delete message:', error);
    }
  }

  function viewMessage(message: Message) {
    setSelectedMessage(message);
    setShowModal(true);
    
    // Mark as read when viewing
    if (message.status === 'unread') {
      toggleMessageStatus(message.id, 'unread');
    }
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  if (loading) {
    return <div className="text-center py-12">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-600 mt-1">
            {messages.length} total messages
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All ({messages.length})
          </Button>
          <Button
            variant={statusFilter === 'unread' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('unread')}
          >
            <Mail size={16} className="mr-1" />
            Unread ({unreadCount})
          </Button>
          <Button
            variant={statusFilter === 'read' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('read')}
          >
            <MailOpen size={16} className="mr-1" />
            Read ({messages.length - unreadCount})
          </Button>
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No messages found</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Contact form submissions will appear here'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-6 hover:shadow-lg transition cursor-pointer ${
                message.status === 'unread' ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
              onClick={() => viewMessage(message)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${
                      message.status === 'unread' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {message.status === 'unread' ? (
                        <Mail size={20} className="text-blue-600" />
                      ) : (
                        <MailOpen size={20} className="text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {message.subject}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {message.name}
                        </span>
                        <span>{message.email}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 line-clamp-2 ml-14">
                    {message.message}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-3 ml-14">
                    <Calendar size={14} />
                    {format(new Date(message.created_at), 'MMM d, yyyy • h:mm a')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMessageStatus(message.id, message.status);
                    }}
                    title={message.status === 'read' ? 'Mark as unread' : 'Mark as read'}
                  >
                    {message.status === 'unread' ? (
                      <Eye size={18} />
                    ) : (
                      <Mail size={18} />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(message.id);
                    }}
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <Card 
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedMessage.status === 'unread'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedMessage.status === 'unread' ? 'Unread' : 'Read'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">{selectedMessage.subject}</h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span className="font-medium">{selectedMessage.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {format(new Date(selectedMessage.created_at), 'MMMM d, yyyy • h:mm a')}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  className="text-gray-500"
                >
                  ✕
                </Button>
              </div>

              {/* Message Content */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Message:</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="flex-1"
                >
                  <Mail size={18} className="mr-2" />
                  Reply via Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleMessageStatus(selectedMessage.id, selectedMessage.status)}
                >
                  {selectedMessage.status === 'read' ? (
                    <>
                      <Mail size={18} className="mr-2" />
                      Mark Unread
                    </>
                  ) : (
                    <>
                      <Eye size={18} className="mr-2" />
                      Mark Read
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => deleteMessage(selectedMessage.id)}
                >
                  <Trash2 size={18} className="text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}