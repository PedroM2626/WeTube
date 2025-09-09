import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, Edit, Trash2, Clock, ListPlus, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Video, UserProfile, Comment } from '../types';

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [channel, setChannel] = useState<UserProfile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userLike, setUserLike] = useState<boolean | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const handleShare = () => {
    if (navigator.share && video) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href,
      }).catch(console.error);
    } else if (video) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copiado para a área de transferência!');
      }).catch(() => {
        alert('Não foi possível copiar o link');
      });
    }
  };

  const handleDownload = () => {
    if (video) {
      const link = document.createElement('a');
      link.href = video.video_url;
      link.download = `${video.title}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
      if (currentUser) {
        fetchUserLike();
        fetchCurrentUserProfile();
      }
    }
  }, [id, currentUser]);

  useEffect(() => {
    if (video && currentUser) {
      checkSubscription();
    }
  }, [video, currentUser]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          users (
            id,
            display_name,
            photo_url,
            subscriber_count
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setVideo(data);
      setChannel(data.users);
      
      // Fetch real subscriber count
      if (data.users?.id) {
        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact' })
          .eq('channel_id', data.users.id);
        
        setSubscriberCount(count || 0);
      }

      // Increment view count
      await supabase
        .from('videos')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  };

  const fetchCurrentUserProfile = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users (
            id,
            display_name,
            photo_url
          )
        `)
        .eq('video_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchUserLike = async () => {
    try {
      const { data, error } = await supabase
        .from('video_likes')
        .select('is_like')
        .eq('video_id', id)
        .eq('user_id', currentUser?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserLike(data?.is_like || null);
    } catch (error) {
      console.error('Error fetching user like:', error);
    }
  };

  const checkSubscription = async () => {
    if (!video?.user_id || !currentUser) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', currentUser.id)
        .eq('channel_id', video.user_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsSubscribed(!!data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleLike = async (isLike: boolean) => {
    if (!currentUser || !video) return;

    try {
      if (userLike === isLike) {
        // Remove like/dislike
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', currentUser.id);
        setUserLike(null);
      } else {
        // Add or update like/dislike
        await supabase
          .from('video_likes')
          .upsert({
            video_id: video.id,
            user_id: currentUser.id,
            is_like: isLike
          });
        setUserLike(isLike);
      }

      // Refresh video data to get updated counts
      fetchVideo();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser || !video) return;

    try {
      if (isSubscribed) {
        await supabase
          .from('subscriptions')
          .delete()
          .eq('subscriber_id', currentUser.id)
          .eq('channel_id', video.user_id);
        setIsSubscribed(false);
        setSubscriberCount(prev => prev - 1);
      } else {
        await supabase
          .from('subscriptions')
          .insert({
            subscriber_id: currentUser.id,
            channel_id: video.user_id
          });
        setIsSubscribed(true);
        setSubscriberCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling subscription:', error);
    }
  };

  const addToWatchLater = async () => {
    if (!currentUser || !video) return;

    try {
      const { error } = await supabase
        .from('watch_later')
        .insert({
          user_id: currentUser.id,
          video_id: video.id
        });

      if (error) {
        if (error.code === '23505') {
          alert('Este vídeo já está na sua lista "Assistir mais tarde"');
        } else {
          throw error;
        }
      } else {
        alert('Vídeo adicionado à lista "Assistir mais tarde"');
      }
    } catch (error) {
      console.error('Error adding to watch later:', error);
      alert('Erro ao adicionar à lista');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    try {
      await supabase
        .from('comments')
        .insert({
          video_id: id,
          user_id: currentUser.id,
          content: newComment.trim(),
          parent_id: null
        });

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!currentUser || !replyText.trim()) return;

    try {
      await supabase
        .from('comments')
        .insert({
          video_id: id,
          user_id: currentUser.id,
          content: replyText.trim(),
          parent_id: parentId
        });

      setReplyText('');
      setReplyingTo(null);
      fetchComments();
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleCommentLike = async (commentId: string, isLike: boolean) => {
    if (!currentUser) return;

    try {
      // Check if user already liked/disliked this comment
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('is_like')
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id)
        .single();

      if (existingLike?.is_like === isLike) {
        // Remove like/dislike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id);
      } else {
        // Add or update like/dislike
        await supabase
          .from('comment_likes')
          .upsert({
            comment_id: commentId,
            user_id: currentUser.id,
            is_like: isLike
          });
      }

      fetchComments();
    } catch (error) {
      console.error('Error handling comment like:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      await supabase
        .from('comments')
        .update({ content: editText.trim() })
        .eq('id', commentId)
        .eq('user_id', currentUser?.id);

      setEditingComment(null);
      setEditText('');
      fetchComments();
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

    try {
      await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser?.id);

      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const toggleMenu = (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenus(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dias atrás`;
    }
  };

  const navigateToChannel = (userId: string) => {
    navigate(`/channel/${userId}`);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenus({});
      setShowMoreOptions(false);
      setShowMoreOptions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!video || !channel) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  const topLevelComments = comments.filter(comment => !comment.parent_id);
  const getReplies = (parentId: string) => comments.filter(comment => comment.parent_id === parentId);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden mb-4">
            <video
              src={video.video_url}
              poster={video.thumbnail_url}
              controls
              className="w-full aspect-video"
            />
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{video.title}</h1>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateToChannel(channel.id)}
                  className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                >
                  <img
                    src={channel.photo_url && channel.photo_url.trim() !== '' 
                      ? channel.photo_url 
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.display_name}`}
                    alt={channel.display_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold">{channel.display_name}</h3>
                    <p className="text-sm text-gray-600">{formatNumber(subscriberCount)} inscritos</p>
                  </div>
                </button>
                
                {currentUser && currentUser.id !== video.user_id && (
                  <button
                    onClick={handleSubscribe}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      isSubscribed
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isSubscribed ? 'Inscrito' : 'Inscrever-se'}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-gray-100 rounded-full">
                  <button
                    onClick={() => handleLike(true)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-l-full hover:bg-gray-200 transition-colors ${
                      userLike === true ? 'text-blue-600' : ''
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span>{video.likes || 0}</span>
                  </button>
                  <div className="w-px h-6 bg-gray-300" />
                  <button
                    onClick={() => handleLike(false)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-r-full hover:bg-gray-200 transition-colors ${
                      userLike === false ? 'text-red-600' : ''
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                    <span>{video.dislikes || 0}</span>
                  </button>
                </div>
                
                <button 
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Compartilhar</span>
                </button>
                
                <button 
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>
                
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreOptions(!showMoreOptions);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {showMoreOptions && (
                    <div 
                      className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          addToWatchLater();
                          setShowMoreOptions(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                      >
                        <Clock className="w-5 h-5" />
                        <span>Salvar em "Assistir mais tarde"</span>
                      </button>
                      <button
                        onClick={() => {
                          alert('Funcionalidade de playlist em desenvolvimento');
                          setShowMoreOptions(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                      >
                        <ListPlus className="w-5 h-5" />
                        <span>Salvar na playlist</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Video Description */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <span>{formatNumber(video.views || 0)} visualizações</span>
                <span>{formatDate(video.created_at!)}</span>
              </div>
              <p className="whitespace-pre-wrap">{video.description}</p>
            </div>

            {/* Comments Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold">{comments.length} comentários</h2>
              
              {currentUser && (
                <form onSubmit={handleCommentSubmit} className="flex space-x-3">
                  <img
                    src={currentUserProfile?.photo_url && currentUserProfile.photo_url.trim() !== '' 
                      ? currentUserProfile.photo_url 
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`}
                    alt={currentUserProfile?.display_name || currentUser.email}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Adicione um comentário..."
                      className="w-full p-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none resize-none"
                      rows={1}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setNewComment('')}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Comentar
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {topLevelComments.map((comment) => (
                  <div key={comment.id} className="space-y-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => navigateToChannel(comment.users.id)}
                        className="flex-shrink-0"
                      >
                        <img
                          src={comment.users.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.users.display_name}`}
                          alt={comment.users.display_name}
                          className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
                        />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <button
                            onClick={() => navigateToChannel(comment.users.id)}
                            className="font-semibold text-sm hover:text-blue-600 transition-colors"
                          >
                            {comment.users.display_name}
                          </button>
                          <span className="text-xs text-gray-500">{formatDate(comment.created_at!)}</span>
                          {currentUser?.id === comment.user_id && (
                            <div className="relative">
                              <button
                                onClick={(e) => toggleMenu(comment.id, e)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {openMenus[comment.id] && (
                                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingComment(comment.id);
                                      setEditText(comment.content);
                                      setOpenMenus({});
                                    }}
                                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteComment(comment.id);
                                      setOpenMenus({});
                                    }}
                                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-100 text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Excluir</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {editingComment === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2 border rounded resize-none"
                              rows={2}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditText('');
                                }}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm mb-2">{comment.content}</p>
                        )}

                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleCommentLike(comment.id, true)}
                            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{comment.likes || 0}</span>
                          </button>
                          <button
                            onClick={() => handleCommentLike(comment.id, false)}
                            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>{comment.dislikes || 0}</span>
                          </button>
                          <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            Responder
                          </button>
                        </div>

                        {replyingTo === comment.id && currentUser && (
                          <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex space-x-3 mt-3">
                            <img
                              src={currentUserProfile?.photo_url && currentUserProfile.photo_url.trim() !== '' 
                                ? currentUserProfile.photo_url 
                                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`}
                              alt={currentUserProfile?.display_name || currentUser.email}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Adicione uma resposta..."
                                className="w-full p-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none resize-none"
                                rows={1}
                              />
                              <div className="flex justify-end space-x-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="submit"
                                  disabled={!replyText.trim()}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Responder
                                </button>
                              </div>
                            </div>
                          </form>
                        )}

                        {/* Replies */}
                        {getReplies(comment.id).map((reply) => (
                          <div key={reply.id} className="flex space-x-3 mt-4 ml-8">
                            <button
                              onClick={() => navigateToChannel(reply.users.id)}
                              className="flex-shrink-0"
                            >
                              <img
                                src={reply.users.photo_url && reply.users.photo_url.trim() !== '' 
                                  ? reply.users.photo_url 
                                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.users.display_name}`}
                                alt={reply.users.display_name}
                                className="w-8 h-8 rounded-full hover:opacity-80 transition-opacity"
                              />
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <button
                                  onClick={() => navigateToChannel(reply.users.id)}
                                  className="font-semibold text-sm hover:text-blue-600 transition-colors"
                                >
                                  {reply.users.display_name}
                                </button>
                                <span className="text-xs text-gray-500">{formatDate(reply.created_at!)}</span>
                                {currentUser?.id === reply.user_id && (
                                  <div className="relative">
                                    <button
                                      onClick={(e) => toggleMenu(reply.id, e)}
                                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    {openMenus[reply.id] && (
                                      <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingComment(reply.id);
                                            setEditText(reply.content);
                                            setOpenMenus({});
                                          }}
                                          className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                                        >
                                          <Edit className="w-4 h-4" />
                                          <span>Editar</span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteComment(reply.id);
                                            setOpenMenus({});
                                          }}
                                          className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-100 text-red-600 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          <span>Excluir</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {editingComment === reply.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-2 border rounded resize-none"
                                    rows={2}
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => {
                                        setEditingComment(null);
                                        setEditText('');
                                      }}
                                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleEditComment(reply.id)}
                                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm mb-2">{reply.content}</p>
                              )}

                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() => handleCommentLike(reply.id, true)}
                                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                  <span>{reply.likes || 0}</span>
                                </button>
                                <button
                                  onClick={() => handleCommentLike(reply.id, false)}
                                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                  <span>{reply.dislikes || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with related videos */}
        <div className="space-y-4">
          <h3 className="font-semibold">Vídeos relacionados</h3>
          {/* Related videos would go here */}
        </div>
      </div>
    </div>
  );
}