export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  user_id: string;
  views: number;
  likes: number;
  dislikes: number;
  duration: string;
  visibility: 'public' | 'private' | 'unlisted';
  created_at: string;
  updated_at?: string;
  // Joined fields from users table
  user_display_name?: string;
  user_photo_url?: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  photo_url: string;
  banner_url?: string;
  bio: string;
  subscriber_count: number;
  video_count: number;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  likes: number;
  dislikes: number;
  parent_id?: string;
  created_at: string;
  updated_at?: string;
  // Joined fields from users table
  user_display_name?: string;
  user_photo_url?: string;
  // Replies
  replies?: Comment[];
}

export interface VideoLike {
  id: string;
  video_id: string;
  user_id: string;
  is_like: boolean;
  created_at: string;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  is_like: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  channel_id: string;
  created_at: string;
}

export interface WatchLater {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  user_id: string;
  visibility: 'public' | 'private' | 'unlisted';
  thumbnail_url: string;
  video_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_display_name?: string;
  user_photo_url?: string;
}

export interface PlaylistVideo {
  id: string;
  playlist_id: string;
  video_id: string;
  position: number;
  added_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string;
  likes: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_display_name?: string;
  user_photo_url?: string;
}