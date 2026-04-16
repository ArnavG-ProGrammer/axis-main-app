-- ============================================================
-- AXIS Platform — Full Database Schema
-- Paste this entire file into the Supabase SQL Editor and run
-- ============================================================

-- Companies table
create table companies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  handle text unique not null,
  sector text not null,
  bio text,
  location text,
  tags text[] default '{}',
  logo_url text,
  website text,
  founded_year integer,
  team_size text,
  partnership_seeking text[] default '{}',
  followers_count integer default 0,
  following_count integer default 0,
  verified boolean default false,
  is_private boolean default false,
  hide_from_discover boolean default false,
  created_at timestamptz default now()
);

-- Posts table
create table posts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  content text not null,
  is_partnership_opportunity boolean default false,
  likes_count integer default 0,
  reposts_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now()
);

-- Post likes
create table post_likes (
  post_id uuid references posts(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, company_id)
);

-- Comments
create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Follows
create table follows (
  follower_id uuid references companies(id) on delete cascade,
  following_id uuid references companies(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- Partnership requests
create table partnership_requests (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references companies(id) on delete cascade,
  receiver_id uuid references companies(id) on delete cascade,
  message text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Legal documents
create table legal_documents (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  type text not null,
  title text not null,
  party_a text not null,
  party_b text not null,
  fields jsonb not null default '{}',
  document_text text not null,
  created_at timestamptz default now()
);

-- Stock watchlist
create table stock_watchlist (
  company_id uuid references companies(id) on delete cascade,
  ticker text not null,
  added_at timestamptz default now(),
  primary key (company_id, ticker)
);

-- Activity history
create table activity_history (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  type text not null,
  description text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Valuation snapshots
create table valuation_snapshots (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  inputs jsonb not null,
  estimated_low bigint not null,
  estimated_high bigint not null,
  methodology text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Enable Row Level Security
-- ============================================================

alter table companies enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table comments enable row level security;
alter table follows enable row level security;
alter table partnership_requests enable row level security;
alter table legal_documents enable row level security;
alter table stock_watchlist enable row level security;
alter table activity_history enable row level security;
alter table valuation_snapshots enable row level security;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Companies: public read, owner write
create policy "Public companies are viewable by all"
  on companies for select using (true);

create policy "Users can insert their own company"
  on companies for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own company"
  on companies for update
  using (auth.uid() = user_id);

create policy "Users can delete their own company"
  on companies for delete
  using (auth.uid() = user_id);

-- Posts: public read, owner insert
create policy "Posts are viewable by all"
  on posts for select using (true);

create policy "Company owners can insert posts"
  on posts for insert with check (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

create policy "Company owners can delete their posts"
  on posts for delete using (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

-- Post likes: public read, owner manage
create policy "Post likes are viewable by all"
  on post_likes for select using (true);

create policy "Users can manage their own likes"
  on post_likes for all using (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

-- Comments: public read, owner insert
create policy "Comments are viewable by all"
  on comments for select using (true);

create policy "Company owners can insert comments"
  on comments for insert with check (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

-- Follows: public read, owner manage
create policy "All follows visible"
  on follows for select using (true);

create policy "Users can manage their follows"
  on follows for all using (
    exists (
      select 1 from companies
      where id = follower_id and user_id = auth.uid()
    )
  );

-- Partnership requests: participants can read
create policy "Participants can view their requests"
  on partnership_requests for select using (
    exists (
      select 1 from companies
      where (id = sender_id or id = receiver_id)
      and user_id = auth.uid()
    )
  );

create policy "Company owners can send requests"
  on partnership_requests for insert with check (
    exists (
      select 1 from companies
      where id = sender_id and user_id = auth.uid()
    )
  );

create policy "Receiver can update request status"
  on partnership_requests for update using (
    exists (
      select 1 from companies
      where id = receiver_id and user_id = auth.uid()
    )
  );

-- Legal documents: owner only
create policy "Users can view their own documents"
  on legal_documents for select using (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

create policy "Users can insert their own documents"
  on legal_documents for insert with check (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

create policy "Users can delete their own documents"
  on legal_documents for delete using (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

-- Stock watchlist: owner only
create policy "Users can manage their watchlist"
  on stock_watchlist for all using (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

-- Activity history: owner only
create policy "Users can view their own activity"
  on activity_history for select using (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

create policy "Users can insert their own activity"
  on activity_history for insert with check (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

-- Valuation snapshots: owner only
create policy "Users can manage their valuations"
  on valuation_snapshots for all using (
    exists (
      select 1 from companies
      where id = company_id and user_id = auth.uid()
    )
  );

-- ============================================================
-- Enable Realtime on posts table
-- ============================================================
alter publication supabase_realtime add table posts;
