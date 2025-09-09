import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Video, UserProfile } from '../types';
import VideoCard from '../components/VideoCard';
import { User, Edit, Camera, Users, Video as VideoIcon, Calendar } from 'lucide-react';

const Channel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [channel, setChannel] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [editingBanner, setEditingBanner] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchChannel(id);
      fetchChannelVideos(id);
      if (currentUser) {
        fetchSubscriptionStatus(id);
      }
    }
  }, [id, currentUser]);

  const fetchChannel = async (channelId: string) => {
    try {
      const { data: channelData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) throw error;

      setChannel(channelData);
      setSubscriberCount(channelData.subscriber_count || 0);
      setBannerUrl(channelData.banner_url || '');
    } catch (error) {
      console.error('Error fetching channel:', error);
    }
  };

  const fetchChannelVideos = async (channelId: string) => {
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
        .eq('user_id', channelId)
        .eq('visibility', 'public')
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
        visibility: video.visibility || 'public',
        created_at: video.created_at,
        updated_at: video.updated_at,
        user_display_name: video.users?.display_name || 'Usuário',
        user_photo_url: video.users?.photo_url || '',
      }));

      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error fetching channel videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async (channelId: string) => {
    if (!currentUser || currentUser.id === channelId) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', currentUser.id)
        .eq('channel_id', channelId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setIsSubscribed(!!data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser || !channel || currentUser.id === channel.id) return;

    try {
      if (isSubscribed) {
        // Unsubscribe
        await supabase
          .from('subscriptions')
          .delete()
          .eq('subscriber_id', currentUser.id)
          .eq('channel_id', channel.id);
        
        setIsSubscribed(false);
        setSubscriberCount(prev => prev - 1);
      } else {
        // Subscribe
        await supabase
          .from('subscriptions')
          .insert({
            subscriber_id: currentUser.id,
            channel_id: channel.id,
          });
        
        setIsSubscribed(true);
        setSubscriberCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling subscription:', error);
    }
  };

  const handleBannerUpload = async () => {
    if (!bannerFile || !currentUser || !channel || currentUser.id !== channel.id) return;

    try {
      const bannerFileName = `${currentUser.id}/banner_${Date.now()}_${bannerFile.name}`;
      const { data: bannerUpload, error: bannerError } = await supabase.storage
        .from('banners')
        .upload(bannerFileName, bannerFile);

      if (bannerError) throw bannerError;

      const { data: newBannerUrl } = supabase.storage
        .from('banners')
        .getPublicUrl(bannerUpload.path);

      // Update user profile with banner URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ banner_url: newBannerUrl.publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setBannerUrl(newBannerUrl.publicUrl);
      setBannerFile(null);
      setEditingBanner(false);
      alert('Banner atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      alert('Erro ao fazer upload do banner: ' + error.message);
    }
  };

  const formatSubscribers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Canal não encontrado</h2>
        <p className="text-gray-600">O canal que você está procurando não existe.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-red-500 to-red-600 overflow-hidden">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt="Banner do canal"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-red-500 to-red-600"></div>
        )}
        
        {currentUser?.id === channel.id && (
          <div className="absolute top-4 right-4">
            {editingBanner ? (
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                  className="mb-3 text-sm"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingBanner(false);
                      setBannerFile(null);
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleBannerUpload}
                    disabled={!bannerFile}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingBanner(true)}
                className="flex items-center space-x-2 bg-black bg-opacity-50 text-white px-3 py-2 rounded-md hover:bg-opacity-70 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Editar banner</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Channel Info */}
      <div className="px-4 py-6">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            {channel.photo_url ? (
              <img
                src={channel.photo_url}
                alt={channel.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <User className="w-8 h-8 md:w-12 md:h-12 text-gray-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {channel.display_name}
            </h1>
            
            <div className="flex items-center space-x-4 text-gray-600 mb-4">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{formatSubscribers(subscriberCount)} inscritos</span>
              </div>
              <div className="flex items-center space-x-1">
                <VideoIcon className="w-4 h-4" />
                <span>{videos.length} vídeos</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Desde {formatDate(channel.created_at)}</span>
              </div>
            </div>
            
            {channel.bio && (
              <p className="text-gray-700 mb-4 max-w-2xl">{channel.bio}</p>
            )}
            
            <div className="flex items-center space-x-4">
              {currentUser?.id !== channel.id && currentUser && (
                <button
                  onClick={handleSubscribe}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-full transition-colors ${
                    isSubscribed 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{isSubscribed ? 'Inscrito' : 'Inscrever-se'}</span>
                </button>
              )}
              
              {currentUser?.id === channel.id && (
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar canal</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="px-4 pb-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button className="py-4 px-1 border-b-2 border-red-500 font-medium text-sm text-red-600">
              Vídeos
            </button>
          </nav>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <VideoIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum vídeo público</h2>
            <p className="text-gray-600">
              Este canal ainda não publicou nenhum vídeo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;