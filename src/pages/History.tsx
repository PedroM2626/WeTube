import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import { History as HistoryIcon, Trash2 } from 'lucide-react';

const History: React.FC = () => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchHistory();
    }
  }, [currentUser]);

  const fetchHistory = async () => {
    if (!currentUser) return;

    try {
      // Simulando histórico com vídeos mais visualizados
      const { data: videosData, error } = await supabase
        .from('videos')
        .select(`
          *,
          users!videos_user_id_fkey (
            display_name,
            photo_url
          )
        `)
        .order('views', { ascending: false })
        .limit(20);

      if (error) throw error;

      const transformedVideos: Video[] = (videosData || []).map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail_url: video.thumbnail_url,
        video_url: video.video_url,
        user_id: video.user_id,
        views: video.views,
        likes: video.likes,
        dislikes: video.dislikes,
        duration: video.duration,
        visibility: video.visibility || 'public',
        created_at: video.created_at,
        updated_at: video.updated_at,
        user_display_name: video.users?.display_name || 'Usuário',
        user_photo_url: video.users?.photo_url || '',
      }));

      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      setVideos([]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="w-8 h-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Histórico</h1>
            <p className="text-gray-600 mt-1">{videos.length} vídeos no histórico</p>
          </div>
        </div>
        {videos.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar histórico</span>
          </button>
        )}
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <HistoryIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum vídeo no histórico</h2>
          <p className="text-gray-600">
            Os vídeos que você assistir aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
};

export default History;