import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Save, Upload as UploadIcon, ArrowLeft } from 'lucide-react';
import { Video } from '../types';

interface EditVideoFormData {
  title: string;
  description: string;
}

const EditVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditVideoFormData>();

  useEffect(() => {
    if (id && currentUser) {
      fetchVideo(id);
    }
  }, [id, currentUser]);

  const fetchVideo = async (videoId: string) => {
    try {
      const { data: videoData, error } = await supabase
        .from('videos')
        .select(`
          *,
          users!videos_user_id_fkey (
            display_name,
            photo_url
          )
        `)
        .eq('id', videoId)
        .single();

      if (error) throw error;

      // Check if user owns this video
      if (videoData.user_id !== currentUser?.id) {
        navigate('/my-videos');
        return;
      }

      const transformedVideo: Video = {
        id: videoData.id,
        title: videoData.title,
        description: videoData.description,
        thumbnail_url: videoData.thumbnail_url,
        video_url: videoData.video_url,
        user_id: videoData.user_id,
        views: videoData.views,
        likes: videoData.likes,
        dislikes: videoData.dislikes,
        duration: videoData.duration,
        created_at: videoData.created_at,
        updated_at: videoData.updated_at,
        user_display_name: videoData.users?.display_name || 'Usuário',
        user_photo_url: videoData.users?.photo_url || '',
      };
      
      setVideo(transformedVideo);
      reset({
        title: transformedVideo.title,
        description: transformedVideo.description
      });
    } catch (error) {
      console.error('Error fetching video:', error);
      navigate('/my-videos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditVideoFormData) => {
    if (!video || !id) return;

    setSaving(true);
    try {
      let thumbnailUrl = video.thumbnail_url;

      // Upload new thumbnail if selected
      if (thumbnailFile) {
        const thumbnailFileName = `${currentUser!.id}/${Date.now()}_${thumbnailFile.name}`;
        const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbnailError) throw thumbnailError;

        const { data: newThumbnailUrl } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailUpload.path);

        thumbnailUrl = newThumbnailUrl.publicUrl;
      }

      // Update video document
      const { error } = await supabase
        .from('videos')
        .update({
          title: data.title,
          description: data.description,
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      alert('Vídeo atualizado com sucesso!');
      navigate('/my-videos');
    } catch (error: any) {
      console.error('Error updating video:', error);
      alert('Erro ao atualizar vídeo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vídeo não encontrado</h2>
        <p className="text-gray-600">O vídeo que você está tentando editar não foi encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/my-videos')}
          className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para meus vídeos</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Editar vídeo</h1>
          <p className="text-gray-600 mt-1">Atualize as informações do seu vídeo</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Preview</h3>
              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  src={video.video_url}
                  poster={video.thumbnail_url}
                  controls
                  className="w-full h-full"
                />
              </div>
              
              {/* Current Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail atual
                </label>
                <div className="relative inline-block">
                  <img
                    src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : video.thumbnail_url}
                    alt="Thumbnail"
                    className="w-40 h-24 object-cover rounded-lg border border-gray-300"
                  />
                  <label className="absolute bottom-1 right-1 bg-red-600 text-white rounded-full p-1 cursor-pointer hover:bg-red-700 transition-colors">
                    <UploadIcon className="w-3 h-3" />
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {thumbnailFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Nova thumbnail selecionada: {thumbnailFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  {...register('title', { 
                    required: 'Título é obrigatório',
                    maxLength: { value: 100, message: 'Título deve ter no máximo 100 caracteres' }
                  })}
                  type="text"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Título do seu vídeo"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  {...register('description', { 
                    required: 'Descrição é obrigatória',
                    maxLength: { value: 5000, message: 'Descrição deve ter no máximo 5000 caracteres' }
                  })}
                  rows={6}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Descreva seu vídeo..."
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Video Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Estatísticas do vídeo</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{video.views}</p>
                    <p className="text-xs text-gray-500">Visualizações</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{video.likes}</p>
                    <p className="text-xs text-gray-500">Curtidas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{video.dislikes}</p>
                    <p className="text-xs text-gray-500">Descurtidas</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/my-videos')}
                  className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditVideo;