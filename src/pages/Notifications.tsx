import React, { useEffect, useState } from 'react';
import { Bell, User, MessageCircle, Heart, UserPlus, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: 'comment' | 'like' | 'subscribe' | 'upload' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  videoThumbnail?: string;
}

const Notifications: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de notificações
    setTimeout(() => {
      setNotifications([
        {
          id: '1',
          type: 'comment',
          title: 'Novo comentário',
          message: 'João Silva comentou no seu vídeo "Como fazer um bolo"',
          timestamp: '2 horas atrás',
          read: false,
        },
        {
          id: '2',
          type: 'subscribe',
          title: 'Nova inscrição',
          message: 'Maria Santos se inscreveu no seu canal',
          timestamp: '5 horas atrás',
          read: false,
        },
        {
          id: '3',
          type: 'like',
          title: 'Curtida no vídeo',
          message: 'Pedro Oliveira curtiu seu vídeo "Tutorial React"',
          timestamp: '1 dia atrás',
          read: true,
        },
        {
          id: '4',
          type: 'system',
          title: 'Vídeo processado',
          message: 'Seu vídeo foi processado com sucesso e está disponível',
          timestamp: '2 dias atrás',
          read: true,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle className="w-6 h-6 text-blue-600" />;
      case 'like':
        return <Heart className="w-6 h-6 text-red-600" />;
      case 'subscribe':
        return <UserPlus className="w-6 h-6 text-green-600" />;
      case 'upload':
        return <Video className="w-6 h-6 text-purple-600" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          </div>
          <button
            onClick={markAllAsRead}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Marcar todas como lidas
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {notification.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-gray-600">
                Você não tem notificações no momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;