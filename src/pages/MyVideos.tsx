import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Video } from '../types';
import { Play, Edit, Trash2, Eye, ThumbsUp, MessageCircle, MoreVertical } from 'lucide-react';

const MyVideos: React.FC = () => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchMyVideos();
    }
  }, [currentUser]);

  const fetchMyVideos = async () => {
    if (!currentUser) return;

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
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

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
        created_at: video.created_at,
        updated_at: video.updated_at,
        user_display_name: video.users?.display_name || 'Usuário',
        user_photo_url: video.users?.photo_url || '',
      }));

      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, videoUrl: string, thumbnailUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (dbError) throw dbError;

      // Delete files from storage (optional, as they might be referenced by URL)
      try {
        // Extract file path from URL for deletion
        const videoUrlParts = videoUrl.split('/');
        const videoPath = videoUrlParts.slice(-2).join('/'); // user_id/filename
        const thumbnailUrlParts = thumbnailUrl.split('/');
        const thumbnailPath = thumbnailUrlParts.slice(-2).join('/'); // user_id/filename
        
        if (videoPath && videoPath.includes('/')) {
          await supabase.storage.from('videos').remove([videoPath]);
        }
        if (thumbnailPath && thumbnailPath.includes('/')) {
          await supabase.storage.from('thumbnails').remove([thumbnailPath]);
        }
      } catch (storageError) {
        console.error('Error deleting files from storage:', storageError);
      }

      // Update local state
      setVideos(videos.filter(video => video.id !== videoId));
      alert('Vídeo excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting video:', error);
      alert('Erro ao excluir vídeo: ' + error.message);
    }
  };

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
    return date.toLocaleDateString('pt-BR');
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seus vídeos</h1>
          <p className="text-gray-600 mt-1">{videos.length} vídeos publicados</p>
        </div>
        <Link
          to="/upload"
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Novo vídeo
        </Link>
      </div>

      {videos.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vídeo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estatísticas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative">
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-24 h-16 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 rounded-lg group cursor-pointer">
                            <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <Link
                            to={`/watch/${video.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors line-clamp-2"
                          >
                            {video.title}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{video.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{formatViews(video.views)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{video.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>0</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(video.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setSelectedVideo(selectedVideo === video.id ? null : video.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {selectedVideo === video.id && (
                          <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                            <Link
                              to={`/edit-video/${video.id}`}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setSelectedVideo(null)}
                            >
                              <Edit className="w-4 h-4" />
                              <span>Editar</span>
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedVideo(null);
                                handleDeleteVideo(video.id, video.video_url, video.thumbnail_url);
                              }}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum vídeo publicado</h2>
          <p className="text-gray-600 mb-6">
            Você ainda não publicou nenhum vídeo. Comece criando seu primeiro conteúdo!
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Fazer upload do primeiro vídeo
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyVideos;