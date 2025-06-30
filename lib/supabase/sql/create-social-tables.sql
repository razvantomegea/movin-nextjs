-- Social Posts Table
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections Table (many-to-many relationship for user connections)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
  addressee_address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure users can't connect to themselves
  CONSTRAINT no_self_connection CHECK (requester_address != addressee_address),
  -- Ensure unique connection pairs (prevent duplicate requests)
  CONSTRAINT unique_connection UNIQUE (requester_address, addressee_address)
);

-- Post Likes Table (for likes and dislikes)
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL, -- true for like, false for dislike
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one reaction per post per user
  CONSTRAINT unique_post_like UNIQUE (post_id, address)
);

-- Post Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- for nested replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_address ON social_posts(address);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at_desc ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_address_created_at_desc ON social_posts(address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_address);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON connections(addressee_address);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_requester_status ON connections(requester_address, status);
CREATE INDEX IF NOT EXISTS idx_connections_addressee_status ON connections(addressee_address, status);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_address ON post_likes(address);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id_is_like ON post_likes(post_id, is_like);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_address ON post_comments(address);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_comment_id ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id_created_at ON post_comments(post_id, created_at);

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_social_posts
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_connections
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_post_likes
  BEFORE UPDATE ON post_likes
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_post_comments
  BEFORE UPDATE ON post_comments
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Social Posts Policies
-- Users can see posts from themselves and their connections
CREATE POLICY "Users can view posts from connections and themselves" ON social_posts
  FOR SELECT TO authenticated
  USING (
    address = (auth.jwt() ->> 'sub')
    OR
    address IN (
      SELECT CASE 
        WHEN requester_address = (auth.jwt() ->> 'sub') THEN addressee_address
        WHEN addressee_address = (auth.jwt() ->> 'sub') THEN requester_address
      END
      FROM connections 
      WHERE status = 'accepted' 
      AND (requester_address = (auth.jwt() ->> 'sub') OR addressee_address = (auth.jwt() ->> 'sub'))
    )
  );

-- Users can only insert their own posts
CREATE POLICY "Users can insert their own posts" ON social_posts
  FOR INSERT TO authenticated
  WITH CHECK (address = (auth.jwt() ->> 'sub'));

-- Users can only update their own posts
CREATE POLICY "Users can update their own posts" ON social_posts
  FOR UPDATE TO authenticated
  USING (address = (auth.jwt() ->> 'sub'))
  WITH CHECK (address = (auth.jwt() ->> 'sub'));

-- Users can only delete their own posts
CREATE POLICY "Users can delete their own posts" ON social_posts
  FOR DELETE TO authenticated
  USING (address = (auth.jwt() ->> 'sub'));

-- Connections Policies
-- Users can view connections where they are involved
CREATE POLICY "Users can view their connections" ON connections
  FOR SELECT TO authenticated
  USING (
    requester_address = (auth.jwt() ->> 'sub') 
    OR 
    addressee_address = (auth.jwt() ->> 'sub')
  );

-- Users can create connection requests
CREATE POLICY "Users can create connection requests" ON connections
  FOR INSERT TO authenticated
  WITH CHECK (requester_address = (auth.jwt() ->> 'sub'));

-- Users can update connections where they are the addressee (to accept/decline)
-- or where they are the requester (to cancel)
CREATE POLICY "Users can update their connections" ON connections
  FOR UPDATE TO authenticated
  USING (
    requester_address = (auth.jwt() ->> 'sub') 
    OR 
    addressee_address = (auth.jwt() ->> 'sub')
  )
  WITH CHECK (
    requester_address = (auth.jwt() ->> 'sub') 
    OR 
    addressee_address = (auth.jwt() ->> 'sub')
  );

-- Users can delete connections where they are involved
CREATE POLICY "Users can delete their connections" ON connections
  FOR DELETE TO authenticated
  USING (
    requester_address = (auth.jwt() ->> 'sub') 
    OR 
    addressee_address = (auth.jwt() ->> 'sub')
  );

-- Post Likes Policies
-- Users can view likes on posts they can see
CREATE POLICY "Users can view likes on visible posts" ON post_likes
  FOR SELECT TO authenticated
  USING (
    post_id IN (
      SELECT id FROM social_posts
      WHERE address = (auth.jwt() ->> 'sub')
      OR address IN (
        SELECT CASE 
          WHEN requester_address = (auth.jwt() ->> 'sub') THEN addressee_address
          WHEN addressee_address = (auth.jwt() ->> 'sub') THEN requester_address
        END
        FROM connections 
        WHERE status = 'accepted' 
        AND (requester_address = (auth.jwt() ->> 'sub') OR addressee_address = (auth.jwt() ->> 'sub'))
      )
    )
  );

-- Users can only create their own likes
CREATE POLICY "Users can create their own likes" ON post_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    address = (auth.jwt() ->> 'sub')
    AND post_id IN (
      SELECT id FROM social_posts
      WHERE address = (auth.jwt() ->> 'sub')
      OR address IN (
        SELECT CASE 
          WHEN requester_address = (auth.jwt() ->> 'sub') THEN addressee_address
          WHEN addressee_address = (auth.jwt() ->> 'sub') THEN requester_address
        END
        FROM connections 
        WHERE status = 'accepted' 
        AND (requester_address = (auth.jwt() ->> 'sub') OR addressee_address = (auth.jwt() ->> 'sub'))
      )
    )
  );

-- Users can only update their own likes
CREATE POLICY "Users can update their own likes" ON post_likes
  FOR UPDATE TO authenticated
  USING (address = (auth.jwt() ->> 'sub'))
  WITH CHECK (address = (auth.jwt() ->> 'sub'));

-- Users can only delete their own likes
CREATE POLICY "Users can delete their own likes" ON post_likes
  FOR DELETE TO authenticated
  USING (address = (auth.jwt() ->> 'sub'));

-- Post Comments Policies
-- Users can view comments on posts they can see
CREATE POLICY "Users can view comments on visible posts" ON post_comments
  FOR SELECT TO authenticated
  USING (
    post_id IN (
      SELECT id FROM social_posts
      WHERE address = (auth.jwt() ->> 'sub')
      OR address IN (
        SELECT CASE 
          WHEN requester_address = (auth.jwt() ->> 'sub') THEN addressee_address
          WHEN addressee_address = (auth.jwt() ->> 'sub') THEN requester_address
        END
        FROM connections 
        WHERE status = 'accepted' 
        AND (requester_address = (auth.jwt() ->> 'sub') OR addressee_address = (auth.jwt() ->> 'sub'))
      )
    )
  );

-- Users can create comments on posts they can see
CREATE POLICY "Users can create comments on visible posts" ON post_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    address = (auth.jwt() ->> 'sub')
    AND post_id IN (
      SELECT id FROM social_posts
      WHERE address = (auth.jwt() ->> 'sub')
      OR address IN (
        SELECT CASE 
          WHEN requester_address = (auth.jwt() ->> 'sub') THEN addressee_address
          WHEN addressee_address = (auth.jwt() ->> 'sub') THEN requester_address
        END
        FROM connections 
        WHERE status = 'accepted' 
        AND (requester_address = (auth.jwt() ->> 'sub') OR addressee_address = (auth.jwt() ->> 'sub'))
      )
    )
  );

-- Users can only update their own comments
CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE TO authenticated
  USING (address = (auth.jwt() ->> 'sub'))
  WITH CHECK (address = (auth.jwt() ->> 'sub'));

-- Users can only delete their own comments
CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE TO authenticated
  USING (address = (auth.jwt() ->> 'sub')); 