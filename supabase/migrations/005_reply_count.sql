-- Add reply_count column to comments table for efficient reply display
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Auto-maintain reply_count when replies are inserted/deleted
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET reply_count = reply_count - 1 WHERE id = OLD.parent_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT to increment reply_count
DROP TRIGGER IF EXISTS trg_update_comment_reply_count_insert ON comments;
CREATE TRIGGER trg_update_comment_reply_count_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_comment_reply_count();

-- Trigger on DELETE to decrement reply_count
DROP TRIGGER IF EXISTS trg_update_comment_reply_count_delete ON comments;
CREATE TRIGGER trg_update_comment_reply_count_delete
  AFTER DELETE ON comments
  FOR EACH ROW
  WHEN (OLD.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_comment_reply_count();

-- Fix existing reply counts
UPDATE comments SET reply_count = (
  SELECT COUNT(*) FROM comments AS c2 WHERE c2.parent_id = comments.id
);