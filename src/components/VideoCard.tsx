import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video } from '../types';
import { User } from 'lucide-react';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const navigate = useNavigate();

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link to={`/watch/${video.id}`}>
        <div className="relative aspect-video bg-gray-200 overflow-hidden">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
            {video.duration}
          </div>
        </div>
      </Link>
      
      <div className="p-3">
        <div className="flex space-x-3">
          <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            {video.user_photo_url ? (
              <img
                src={video.user_photo_url}
                alt={video.user_display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <Link to={`/watch/${video.id}`}>
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2 hover:text-red-600 transition-colors">
                {video.title}
              </h3>
            </Link>
            
            <div className="mt-1 space-y-1">
              <button 
                onClick={() => navigate(`/channel/${video.user_id}`)}
                className="text-gray-600 text-xs hover:text-red-600 transition-colors text-left"
              >
                {video.user_display_name}
              </button>
              <p className="text-gray-600 text-xs">
                {formatViews(video.views)} visualizações • {formatDate(video.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;