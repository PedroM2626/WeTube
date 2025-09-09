import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import VideoCard from '../components/VideoCard';
import { Video } from '../types';

const Search: React.FC = () => {
  const location = useLocation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    if (searchQuery) {
      searchVideos(searchQuery);
    }
  }, [searchQuery]);

  const searchVideos = async (searchText: string) => {
    try {
      const { data: videosData, error } = await supabase
        .from('videos')
        .select(`
          *,
          users!videos_user_id_fkey (
            display_name,
            photo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform and filter data
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
        created_at: video.created_at,
        updated_at: video.updated_at,
        user_display_name: video.users?.display_name || 'Usuário',
        user_photo_url: video.users?.photo_url || '',
      }));

      // Filter by search query
      const filteredVideos = transformedVideos.filter(video =>
        video.title.toLowerCase().includes(searchText.toLowerCase()) ||
        video.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (video.user_display_name || '').toLowerCase().includes(searchText.toLowerCase())
      );
      
      setVideos(filteredVideos);
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-300 aspect-video rounded-lg mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Resultados para "{searchQuery}"
        </h2>
        <p className="text-gray-600 mt-1">{videos.length} vídeos encontrados</p>
      </div>
      
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum vídeo encontrado</h2>
          <p className="text-gray-600">
            Tente pesquisar com outras palavras-chave.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;