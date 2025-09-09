import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload as UploadIcon, Film } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { getVideoDuration } from '../utils/videoDuration';

interface UploadFormData {
  title: string;
  description: string;
  visibility: 'public' | 'private' | 'unlisted';
}

const Upload: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [videoDuration, setVideoDuration] = useState<string>('0:00');
  const { register, handleSubmit, formState: { errors } } = useForm<UploadFormData>();

  if (!currentUser) {
    navigate('/auth');
    return null;
  }

  const onSubmit = async (data: UploadFormData) => {
    if (!videoFile || !thumbnailFile) {
      alert('Por favor, selecione um vídeo e uma thumbnail.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    
    try {
      // Upload video
      const videoFileName = `${currentUser.id}/${Date.now()}_${videoFile.name}`;
      setUploadProgress(30);
      
      const { data: videoUpload, error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;
      setUploadProgress(60);

      // Upload thumbnail
      const thumbnailFileName = `${currentUser.id}/${Date.now()}_${thumbnailFile.name}`;
      
      const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
        .from('thumbnails')
        .upload(thumbnailFileName, thumbnailFile);

      if (thumbnailError) throw thumbnailError;
      setUploadProgress(80);

      // Get public URLs
      const { data: videoUrl } = supabase.storage
        .from('videos')
        .getPublicUrl(videoUpload.path);

      const { data: thumbnailUrl } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(thumbnailUpload.path);

      // Save video data to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          title: data.title,
          description: data.description,
          video_url: videoUrl.publicUrl,
          thumbnail_url: thumbnailUrl.publicUrl,
          user_id: currentUser.id,
          views: 0,
          likes: 0,
          dislikes: 0,
          duration: videoDuration,
          visibility: data.visibility,
        });

      if (dbError) throw dbError;
      setUploadProgress(100);

      alert('Vídeo enviado com sucesso!');
      navigate('/my-videos');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Erro ao enviar vídeo: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoFileChange = async (file: File | null) => {
    setVideoFile(file);
    if (file) {
      const duration = await getVideoDuration(file);
      setVideoDuration(duration);
    } else {
      setVideoDuration('0:00');
    }
  };
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Enviar vídeo</h1>
          <p className="text-gray-600 mt-1">Compartilhe seu conteúdo com o mundo</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo de vídeo
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-red-400 transition-colors">
              <div className="space-y-1 text-center">
                {videoFile ? (
                  <div>
                    <Film className="mx-auto h-12 w-12 text-red-500" />
                    <p className="text-sm text-gray-600 font-medium">{videoFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none">
                        <span>Clique para enviar</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="video/*"
                          onChange={(e) => handleVideoFileChange(e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">MP4, WEBM, MOV até 100MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-red-400 transition-colors">
              <div className="space-y-1 text-center">
                {thumbnailFile ? (
                  <div>
                    <img
                      src={URL.createObjectURL(thumbnailFile)}
                      alt="Thumbnail preview"
                      className="mx-auto h-24 w-32 object-cover rounded"
                    />
                    <p className="text-sm text-gray-600 font-medium">{thumbnailFile.name}</p>
                  </div>
                ) : (
                  <div>
                    <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500">
                        <span>Selecionar thumbnail</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">JPG, PNG até 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
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

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              {...register('description', { 
                required: 'Descrição é obrigatória',
                maxLength: { value: 5000, message: 'Descrição deve ter no máximo 5000 caracteres' }
              })}
              rows={4}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Descreva seu vídeo..."
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
              Visibilidade
            </label>
            <select
              {...register('visibility')}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="public">Público</option>
              <option value="unlisted">Não listado</option>
              <option value="private">Privado</option>
            </select>
          </div>
          {/* Upload Progress */}
          {uploading && (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>Enviando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading || !videoFile || !thumbnailFile}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Enviando...' : 'Publicar vídeo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;