export type Post = {
  id: string;
  imageUrl: string;
  caption?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
};