-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- profiles policies
-- ============================================
-- Public can read all profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (triggered by auth signup)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- posts policies
-- ============================================
-- Public can read all posts
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- comments policies
-- ============================================
-- Public can read all comments
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- post_votes policies
-- ============================================
-- Public can read all post votes
CREATE POLICY "Post votes are viewable by everyone"
  ON post_votes FOR SELECT
  USING (true);

-- Authenticated users can create post votes
CREATE POLICY "Authenticated users can create post votes"
  ON post_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own post votes
CREATE POLICY "Users can delete their own post votes"
  ON post_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- comment_votes policies
-- ============================================
-- Public can read all comment votes
CREATE POLICY "Comment votes are viewable by everyone"
  ON comment_votes FOR SELECT
  USING (true);

-- Authenticated users can create comment votes
CREATE POLICY "Authenticated users can create comment votes"
  ON comment_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comment votes
CREATE POLICY "Users can delete their own comment votes"
  ON comment_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- follows policies
-- ============================================
-- Public can read all follows
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

-- Authenticated users can follow others
CREATE POLICY "Authenticated users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete their own follow relationships)
CREATE POLICY "Users can unfollow others"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================
-- notifications policies
-- ============================================
-- Users can read their own notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = recipient_id);

-- System can insert notifications (via server-side functions)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- ============================================
-- Follow/unfollow RPC function
-- ============================================
-- Atomically follows or unfollows a user and creates a notification on follow
CREATE OR REPLACE FUNCTION toggle_follow(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  current_user_id UUID := auth.uid();
  already_following BOOLEAN;
BEGIN
  -- Prevent self-follow
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF current_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot follow yourself';
  END IF;

  -- Check if already following
  SELECT EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = current_user_id AND following_id = target_user_id
  ) INTO already_following;

  IF already_following THEN
    -- Unfollow: delete the follow relationship
    DELETE FROM follows
    WHERE follower_id = current_user_id AND following_id = target_user_id;
  ELSE
    -- Follow: insert the follow relationship
    INSERT INTO follows (follower_id, following_id)
    VALUES (current_user_id, target_user_id);

    -- Create notification for the followed user
    INSERT INTO notifications (recipient_id, actor_id, type, created_at)
    VALUES (target_user_id, current_user_id, 'follow_user', NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION toggle_follow(UUID) TO authenticated;