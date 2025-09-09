import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import { Clock, Trash2 } from 'lucide-react';

const WatchLater: React.FC = () => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchWatchLaterVideos();
    }
  }, [currentUser]);

  const fetchWatchLaterVideos = async () => {
    if (!currentUser) return;

    try {
      const { data: watchLaterData, error } = await supabase
        .from('watch_later')
        .select(`
          *,
          videos!watch_later_video_id_fkey (
            *,
            users!videos_user_id_fkey (
              display_name,
              photo_url
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedVideos: Video[] = (watchLaterData || [])
        .filter(item => item.videos) // Filter out null videos
        .map(item => ({
          id: item.videos.id,
          title: item.videos.title,
          description: item.videos.description,
          thumbnail_url: item.videos.thumbnail_url,
          video_url: item.videos.video_url,
          user_id: item.videos.user_id,
          views: item.videos.views,
          likes: item.videos.likes,
          dislikes: item.videos.dislikes,
          duration: item.videos.duration,
          visibility: item.videos.visibility || 'public',
          created_at: item.videos.created_at,
          updated_at: item.videos.updated_at,
          user_display_name: item.videos.users?.display_name || 'Usuário',
          user_photo_url: item.videos.users?.photo_url || '',
        }));

      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error fetching watch later videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchLater = async (videoId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('watch_later')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('video_id', videoId);

      if (error) throw error;

      setVideos(videos.filter(video => video.id !== videoId));
    } catch (error) {
      console.error('Error removing from watch later:', error);
      alert('Erro ao remover vídeo');
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
      <div className="flex items-center space-x-3 mb-8">
        <Clock className="w-8 h-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assistir mais tarde</h1>
          <p className="text-gray-600 mt-1">{videos.length} vídeos salvos</p>
        </div>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="relative group">
              <VideoCard video={video} />
              <button
                onClick={() => removeFromWatchLater(video.id)}
                className="absolute top-2 right-2 p-2 bg-black bg-opacity-70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-90"
                title="Remover da lista"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum vídeo salvo</h2>
          <p className="text-gray-600">
            Vídeos que você salvar para assistir mais tarde aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
};

export default WatchLater;