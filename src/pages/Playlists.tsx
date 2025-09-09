import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Playlist } from '../types';
import { List, Plus, Lock, Eye, EyeOff } from 'lucide-react';

const Playlists: React.FC = () => {
  const { currentUser } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistVisibility, setNewPlaylistVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchPlaylists();
    }
  }, [currentUser]);

  const fetchPlaylists = async () => {
    if (!currentUser) return;

    try {
      const { data: playlistsData, error } = await supabase
        .from('playlists')
        .select(`
          *,
          users!playlists_user_id_fkey (
            display_name,
            photo_url
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedPlaylists: Playlist[] = (playlistsData || []).map(playlist => ({
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        user_id: playlist.user_id,
        visibility: playlist.visibility,
        thumbnail_url: playlist.thumbnail_url,
        video_count: playlist.video_count,
        created_at: playlist.created_at,
        updated_at: playlist.updated_at,
        user_display_name: playlist.users?.display_name || 'Usuário',
        user_photo_url: playlist.users?.photo_url || '',
      }));

      setPlaylists(transformedPlaylists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPlaylistTitle.trim()) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from('playlists')
        .insert({
          title: newPlaylistTitle.trim(),
          description: newPlaylistDescription.trim(),
          user_id: currentUser.id,
          visibility: newPlaylistVisibility,
        });

      if (error) throw error;

      setNewPlaylistTitle('');
      setNewPlaylistDescription('');
      setNewPlaylistVisibility('public');
      setShowCreateForm(false);
      fetchPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Erro ao criar playlist');
    } finally {
      setCreating(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <Lock className="w-4 h-4" />;
      case 'unlisted':
        return <EyeOff className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return 'Privada';
      case 'unlisted':
        return 'Não listada';
      default:
        return 'Pública';
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
          <List className="w-8 h-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suas Playlists</h1>
            <p className="text-gray-600 mt-1">{playlists.length} playlists criadas</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Playlist</span>
        </button>
      </div>

      {/* Create Playlist Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Criar Nova Playlist</h2>
          <form onSubmit={createPlaylist} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Nome da playlist"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                rows={3}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Descrição da playlist (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilidade
              </label>
              <select
                value={newPlaylistVisibility}
                onChange={(e) => setNewPlaylistVisibility(e.target.value as 'public' | 'private' | 'unlisted')}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="public">Pública</option>
                <option value="unlisted">Não listada</option>
                <option value="private">Privada</option>
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating || !newPlaylistTitle.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Criando...' : 'Criar Playlist'}
              </button>
            </div>
          </form>
        </div>
      )}

      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
            >
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                {playlist.thumbnail_url ? (
                  <img
                    src={playlist.thumbnail_url}
                    alt={playlist.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <List className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                  {playlist.title}
                </h3>
                <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                  {getVisibilityIcon(playlist.visibility)}
                  <span>{getVisibilityText(playlist.visibility)}</span>
                  <span>•</span>
                  <span>{playlist.video_count} vídeos</span>
                </div>
                {playlist.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {playlist.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <List className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma playlist criada</h2>
          <p className="text-gray-600 mb-6">
            Crie playlists para organizar seus vídeos favoritos.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira playlist
          </button>
        </div>
      )}
    </div>
  );
};

export default Playlists;