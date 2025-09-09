import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Music, 
  Film, 
  Gamepad2, 
  Newspaper, 
  Trophy, 
  Lightbulb, 
  Shirt, 
  Podcast,
  History,
  PlaySquare,
  Clock,
  ThumbsUp,
  ListVideo,
  User,
  Settings,
  HelpCircle,
  Flag
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();

  const mainItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: TrendingUp, label: 'Em alta', path: '/trending', disabled: true },
    { icon: Music, label: 'Música', path: '/music', disabled: true },
    { icon: Film, label: 'Filmes', path: '/movies', disabled: true },
    { icon: Gamepad2, label: 'Jogos', path: '/gaming', disabled: true },
    { icon: Newspaper, label: 'Notícias', path: '/news', disabled: true },
    { icon: Trophy, label: 'Esportes', path: '/sports', disabled: true },
    { icon: Lightbulb, label: 'Aprender', path: '/learning', disabled: true },
    { icon: Shirt, label: 'Moda e beleza', path: '/fashion', disabled: true },
    { icon: Podcast, label: 'Podcasts', path: '/podcasts', disabled: true },
  ];

  const libraryItems = [
    { icon: History, label: 'Histórico', path: '/history' },
    { icon: PlaySquare, label: 'Seus vídeos', path: '/my-videos' },
    { icon: Clock, label: 'Assistir mais tarde', path: '/watch-later' },
    { icon: ThumbsUp, label: 'Vídeos marcados com "Gostei"', path: '/liked' },
    { icon: ListVideo, label: 'Playlists', path: '/playlists' },
  ];

  const settingsItems = [
    { icon: Settings, label: 'Configurações', path: '/settings', disabled: true },
    { icon: HelpCircle, label: 'Ajuda', path: '/help', disabled: true },
    { icon: Flag, label: 'Enviar feedback', path: '/feedback', disabled: true },
  ];

  const renderMenuItem = (item: any, index: number) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    
    if (item.disabled) {
      return (
        <div
          key={index}
          className="flex items-center px-3 py-2 text-gray-400 cursor-not-allowed"
        >
          <Icon className="w-5 h-5 mr-3" />
          <span className={`${isOpen ? 'block' : 'hidden'} text-sm`}>
            {item.label}
          </span>
        </div>
      );
    }

    return (
      <Link
        key={index}
        to={item.path}
        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-gray-100 text-red-600'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span className={`${isOpen ? 'block' : 'hidden'} text-sm`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className={`bg-white h-full overflow-y-auto transition-all duration-300 fixed left-0 top-16 z-40 border-r border-gray-200 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="p-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainItems.map(renderMenuItem)}
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-200" />

        {/* Library Section */}
        {isOpen && (
          <div className="px-3 py-2">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Biblioteca
            </h3>
          </div>
        )}
        <div className="space-y-1">
          {libraryItems.map(renderMenuItem)}
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-200" />

        {/* Settings Section */}
        <div className="space-y-1">
          {settingsItems.map(renderMenuItem)}
        </div>

        {/* Footer */}
        {isOpen && (
          <div className="px-3 py-4 text-xs text-gray-500">
            <p>© 2024 WeTube</p>
            <p className="mt-1">Clone educacional do YouTube</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;