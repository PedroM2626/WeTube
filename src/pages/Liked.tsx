import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import { ThumbsUp, Heart } from 'lucide-react';

const Liked: React.FC = () => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchLikedVideos();
    }
  }, [currentUser]);

  const fetchLikedVideos = async () => {
    if (!currentUser) return;

    try {
      const { data: likedData, error } = await supabase
        .from('video_likes')
        .select(`
          *,
          videos!video_likes_video_id_fkey (
            *,
            users!videos_user_id_fkey (
              display_name,
              photo_url
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('is_like', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedVideos: Video[] = (likedData || [])
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
      console.error('Error fetching liked videos:', error);
    } finally {
      setLoading(false);
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
        <Heart className="w-8 h-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vídeos marcados com "Gostei"</h1>
          <p className="text-gray-600 mt-1">{videos.length} vídeos curtidos</p>
        </div>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ThumbsUp className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum vídeo curtido</h2>
          <p className="text-gray-600">
            Vídeos que você curtir aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
};

export default Liked;