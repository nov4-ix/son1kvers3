# Supabase Configuration for Super-Son1k-2.0

## Database Setup

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and enter project details:
   - Name: `super-son1k-2.0`
   - Database Password: Generate strong password
   - Region: Choose closest to your users

### 2. Database Configuration
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('FREE', 'PRO', 'PREMIUM', 'ENTERPRISE');
CREATE TYPE generation_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');
```

### 3. Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User tiers
CREATE POLICY "Users can view own tier" ON user_tiers
  FOR SELECT USING (auth.uid() = "userId");

-- Generations
CREATE POLICY "Users can view own generations" ON generations
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can create own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Tokens (admin only)
CREATE POLICY "Admins can manage tokens" ON tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND "isAdmin" = true
    )
  );

-- Collaborations
CREATE POLICY "Users can view own collaborations" ON collaborations
  FOR SELECT USING (
    auth.uid() = "userId" OR 
    EXISTS (
      SELECT 1 FROM collaboration_members 
      WHERE "collaborationId" = collaborations.id AND "userId" = auth.uid()
    )
  );

-- NFTs
CREATE POLICY "Users can view all NFTs" ON nfts
  FOR SELECT USING (true);

CREATE POLICY "Users can create own NFTs" ON nfts
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Analytics (admin only)
CREATE POLICY "Admins can view analytics" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND "isAdmin" = true
    )
  );
```

## Authentication Setup

### 1. Configure Auth Providers
1. Go to Authentication > Settings
2. Configure providers:

#### Google OAuth
- Enable Google provider
- Add Google OAuth credentials:
  - Client ID: `GOOGLE_CLIENT_ID`
  - Client Secret: `GOOGLE_CLIENT_SECRET`
- Redirect URL: `https://your-domain.com/auth/callback`

#### Facebook OAuth
- Enable Facebook provider
- Add Facebook OAuth credentials:
  - App ID: `FACEBOOK_APP_ID`
  - App Secret: `FACEBOOK_APP_SECRET`
- Redirect URL: `https://your-domain.com/auth/callback`

### 2. Email Configuration
- Configure SMTP settings for email verification
- Customize email templates
- Set up email rate limiting

### 3. JWT Configuration
- Set JWT expiry time: 7 days
- Configure JWT secret: `JWT_SECRET`
- Enable refresh tokens

## Storage Setup

### 1. Create Storage Buckets
```sql
-- Create buckets for different file types
INSERT INTO storage.buckets (id, name, public) VALUES
  ('audio-files', 'audio-files', true),
  ('images', 'images', true),
  ('documents', 'documents', false),
  ('temp-files', 'temp-files', false);
```

### 2. Storage Policies
```sql
-- Audio files - public read, authenticated write
CREATE POLICY "Audio files are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-files');

CREATE POLICY "Authenticated users can upload audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio-files' AND 
    auth.role() = 'authenticated'
  );

-- Images - public read, authenticated write
CREATE POLICY "Images are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    auth.role() = 'authenticated'
  );

-- Documents - private, owner only
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Edge Functions

### 1. Create Functions Directory
```bash
mkdir -p supabase/functions
```

### 2. Token Sync Function
```typescript
// supabase/functions/sync-tokens/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { tokens, extensionId } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process tokens
    for (const token of tokens) {
      await supabase
        .from('tokens')
        .upsert({
          hash: token.hash,
          userId: token.userId,
          email: token.email,
          isActive: token.isActive,
          isValid: token.isValid,
          tier: token.tier,
          metadata: token.metadata,
          encryptedToken: token.encryptedToken
        })
    }

    return new Response(
      JSON.stringify({ success: true, processed: tokens.length }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

## Environment Variables

### Supabase Project Settings
```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# API Keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Auth
JWT_SECRET=your-jwt-secret
```

## Monitoring & Analytics

### 1. Enable Analytics
- Go to Settings > Analytics
- Enable usage analytics
- Configure data retention

### 2. Set up Alerts
- Database performance alerts
- Auth failure alerts
- Storage quota alerts

### 3. Backup Configuration
- Enable automatic backups
- Set backup retention period
- Configure point-in-time recovery

## Security Configuration

### 1. API Security
- Enable API rate limiting
- Configure CORS policies
- Set up API key restrictions

### 2. Database Security
- Enable SSL connections
- Configure IP restrictions
- Set up connection pooling

### 3. Auth Security
- Enable MFA (Multi-Factor Authentication)
- Configure password policies
- Set up session management

## Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] RLS policies configured
- [ ] Auth providers configured
- [ ] Storage buckets created
- [ ] Edge functions deployed
- [ ] Environment variables set
- [ ] Monitoring configured
- [ ] Security policies applied
- [ ] Backup strategy implemented

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Check policy syntax
   - Verify user permissions
   - Test with different user roles

2. **Auth Provider Issues**
   - Verify OAuth credentials
   - Check redirect URLs
   - Test with different browsers

3. **Storage Upload Failures**
   - Check bucket policies
   - Verify file size limits
   - Test with different file types

4. **Database Connection Issues**
   - Verify connection string
   - Check SSL configuration
   - Test with different clients

### Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Community Forum](https://github.com/supabase/supabase/discussions)
- [Discord Community](https://discord.supabase.com)
