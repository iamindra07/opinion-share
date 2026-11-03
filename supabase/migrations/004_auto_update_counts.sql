-- Auto-maintain comment_count on posts table when comments are inserted/deleted
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_post_comment_count_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

CREATE TRIGGER trg_update_post_comment_count_delete
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- Auto-maintain upvote_count on posts table when post_votes are inserted/deleted
CREATE OR REPLACE FUNCTION update_post_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET upvote_count = upvote_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_post_upvote_count_insert
  AFTER INSERT ON post_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_upvote_count();

CREATE TRIGGER trg_update_post_upvote_count_delete
  AFTER DELETE ON post_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_upvote_count();

-- Auto-maintain upvote_count on comments table when comment_votes are inserted/deleted
CREATE OR REPLACE FUNCTION update_comment_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET upvote_count = upvote_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET upvote_count = upvote_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_comment_upvote_count_insert
  AFTER INSERT ON comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_upvote_count();

CREATE TRIGGER trg_update_comment_upvote_count_delete
  AFTER DELETE ON comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_upvote_count();