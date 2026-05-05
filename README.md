# Smart Travel Hacks - Travel Blogging Platform

A production-ready, SEO-optimized blogging platform built for travel content creators. Designed for Google rankings, monetization, and scalability with comprehensive performance optimizations.

## 🚀 Overview

**Smart Travel Hacks** is a modern blogging platform specifically engineered for publishing travel-focused content with maximum SEO impact. Built with React, TypeScript, Tailwind CSS, and Supabase, it includes enterprise-grade features like real-time SEO scoring, automated monetization, comment systems, and comprehensive resilience mechanisms.

### Key Highlights
- ✅ **SEO-First Architecture** - Real-time scoring, structured data, automatic sitemaps
- ✅ **Monetization Ready** - AdSense integration, affiliate tracking, click analytics
- ✅ **Performance Optimized** - Handles 500+ posts with pagination and efficient queries
- ✅ **Production Resilient** - Error boundaries, auto-retry, health monitoring
- ✅ **Modern Stack** - React 18, TypeScript, Tailwind v4, Supabase Edge Functions

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Getting Started](#-getting-started)
4. [Project Structure](#-project-structure)
5. [Configuration](#-configuration)
6. [SEO Optimization](#-seo-optimization)
7. [Monetization](#-monetization)
8. [API Documentation](#-api-documentation)
9. [Deployment](#-deployment)
10. [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### Content Management System
- **Block-Based Editor** - Google Docs-style rich text editor with drag-and-drop blocks
- **Advanced Content Blocks** - Headings, paragraphs, images, lists, tables, callouts, code blocks, buttons
- **Media Library** - Upload, organize, and manage images via Supabase Storage
- **Draft & Publishing** - Save drafts, schedule posts, publish instantly
- **Categories & Tags** - Organize and filter content for better discoverability
- **Bulk Operations** - Mass actions for posts, categories, and tags

### SEO & Performance
- **Real-Time SEO Analysis** - Live scoring with actionable recommendations (target: 80+)
- **Structured Data** - Automatic JSON-LD schema for articles, FAQs, products, organizations
- **Dynamic Sitemaps** - Auto-generated XML sitemap at `/sitemap.xml`
- **Meta Tag Management** - Custom title, description, Open Graph, Twitter Cards
- **Canonical URLs** - Prevent duplicate content issues
- **Image Optimization** - Alt text enforcement, lazy loading
- **Redirect System** - 301/302 redirects with hit tracking
- **Search Functionality** - Full-text search across all posts

### Monetization & Analytics
- **Google AdSense** - Strategic ad placement (first paragraph, mid-article, sidebar)
- **Affiliate Link Management** - Trackable `/go/` redirects with click analytics
- **Performance Dashboard** - View counts, engagement metrics, top content
- **Click Tracking** - Monitor affiliate link performance with referrer data
- **Affiliate Disclosure** - Automated disclosure notices for compliance

### User Engagement
- **Comment System** - Full CRUD with nested replies, spam detection
- **Social Sharing** - Facebook, Twitter, LinkedIn integration
- **Newsletter Subscription** - Email capture with Supabase backend
- **Contact Forms** - Message management system with admin inbox
- **Social Media Links** - Dynamic footer with TikTok, Instagram, Facebook, YouTube

### Admin Dashboard
- **Secure Authentication** - Supabase Auth with email/password and OAuth support
- **Dashboard Analytics** - Quick stats, recent posts, top performers
- **Content Audit** - Review and optimize existing posts
- **System Health Monitor** - Real-time health checks for backend, database, localStorage
- **Settings Management** - Site configuration, AdSense, analytics, social media
- **Mobile Responsive** - Full admin experience on any device

### Resilience & Stability
- **Error Boundaries** - Graceful handling of component crashes
- **Automatic Retry Logic** - Exponential backoff for failed API calls
- **Health Monitoring** - Check backend/database/localStorage every 5 minutes
- **Data Migration System** - Handle schema changes without data loss
- **Version Tracking** - Track application version and changes
- **System Status Dashboard** - Real-time health indicators in admin panel

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router 7 (Data Mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **Forms**: React Hook Form
- **Date Handling**: date-fns

### Backend
- **BaaS**: Supabase (Database, Auth, Storage)
- **Runtime**: Supabase Edge Functions (Deno)
- **Web Framework**: Hono
- **Database**: Supabase KV Store
- **File Storage**: Supabase Storage (for images)
- **Authentication**: Supabase Auth (email/password + OAuth)

### Build & Development
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Type Checking**: TypeScript 5
- **Linting**: ESLint
- **Code Quality**: Prettier (implied)

---

## Deploy to Vercel via GitHub

This repo is configured for `CodeStar86/SmartTravelHacks` and Vercel's GitHub integration. See [`docs/VERCEL-GITHUB-DEPLOYMENT.md`](docs/VERCEL-GITHUB-DEPLOYMENT.md) for the exact Git, Vercel, and Supabase steps.

Recommended Vercel settings:

```text
Framework Preset: Vite
Build Command: npm run build:ssg
Output Directory: dist
Install Command: npm install
Root Directory: ./
Node.js Version: 20.x
```

**Important for SEO:** production deploys must use `npm run build:ssg`. The default `npm run build` script now delegates to `build:ssg`, while `npm run build:spa` is available only for a plain SPA build. The SSG build generates `public/data/content-manifest.json`, `public/sitemap.xml`, `public/robots.txt`, and prerendered public routes so Google can fetch blog posts as real pages.

If Vercel cannot fetch Supabase posts during the build, blog pages and the sitemap may be empty. Apply `supabase/migrations/0004_public_read_policies.sql` or provide `SUPABASE_SERVICE_ROLE_KEY` as a Production environment variable before redeploying.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- pnpm package manager
- Supabase project (created automatically in Figma Make)

### Quick Start

#### 1. Create Admin Account
First, create an admin user via Supabase Auth:

```javascript
// Create the first admin in Supabase Auth, then add the email to ADMIN_EMAILS
// Or use the Supabase dashboard: Authentication > Users > Add User
```

#### 2. Login to Admin Panel
- Navigate to `/admin/login`
- Enter your credentials
- Access dashboard at `/admin`

#### 3. Configure Site Settings
Go to `/admin/settings` and configure:
- **Site Name** - Your blog name (e.g., "Smart Travel Hacks")
- **Site Description** - Homepage meta description
- **Site URL** - Production domain (important for SEO)
- **Google Analytics** - GA4 measurement ID
- **AdSense Publisher ID** - Your `ca-pub-XXXXXXXX` ID
- **Social Media** - TikTok, Instagram, Facebook, YouTube URLs

#### 4. Create Categories & Tags
- Go to `/admin/categories` - Create categories (e.g., "Destinations", "Travel Tips")
- Go to `/admin/tags` - Add relevant tags for your content

#### 5. Publish Your First Post
1. Navigate to `/admin/posts/new`
2. Add title (slug auto-generates)
3. Use block editor to add content
4. Upload featured image
5. Select categories and tags
6. Configure SEO (focus keyword, meta description)
7. Publish or save as draft

---

## 📁 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── components/          # React components
│   │   │   ├── admin/          # Admin-specific components
│   │   │   ├── ui/             # UI component library (shadcn/ui)
│   │   │   └── *.tsx           # Shared components
│   │   ├── context/            # React context providers
│   │   │   └── SettingsContext.tsx
│   │   ├── lib/                # Utility functions & APIs
│   │   │   ├── api.ts          # API client
│   │   │   ├── health.ts       # Health monitoring
│   │   │   ├── migrations.ts   # Data migrations
│   │   │   ├── seo-utils.ts    # SEO helpers
│   │   │   ├── slug.ts         # Slug generation
│   │   │   ├── supabase.ts     # Supabase client
│   │   │   └── version.ts      # Version tracking
│   │   ├── pages/              # Page components
│   │   │   ├── admin/          # Admin pages
│   │   │   └── *.tsx           # Public pages
│   │   ├── types/              # TypeScript definitions
│   │   ├── App.tsx             # Root component
│   │   └── routes.tsx          # Route configuration
│   └── styles/                 # Global styles
│       ├── fonts.css           # Font imports
│       ├── index.css           # Main stylesheet
│       ├── tailwind.css        # Tailwind directives
│       └── theme.css           # CSS variables & theme
├── supabase/
│   └── functions/
│       └── server/             # Edge functions
│           ├── index.tsx       # Hono server
├── utils/
│   └── supabase/
│       └── info.tsx            # Supabase config
├── package.json                # Dependencies
├── vite.config.ts              # Vite configuration
├── postcss.config.mjs          # PostCSS config
└── README.md                   # This file
```

### Key Directories

#### `/src/app/components/`
Reusable React components:
- `PublicHeader.tsx` & `PublicFooter.tsx` - Site-wide navigation
- `SEOHead.tsx` - Dynamic meta tags and structured data
- `ContentRenderer.tsx` - Render block-based content
- `Comments.tsx` - Comment system with nested replies
- `RedirectHandler.tsx` - Handle 301/302 redirects
- `ErrorBoundary.tsx` - Catch and handle React errors
- `admin/` - Admin dashboard components (BlockEditor, SEOPanel, SystemStatus)
- `ui/` - shadcn/ui component library (buttons, cards, dialogs, etc.)

#### `/src/app/pages/`
Page components:
- **Public Pages**: HomePage, BlogPage, ArticlePage, AboutPage, ContactPage, TravelResourcesPage
- **Admin Pages**: Dashboard, Posts, PostEditor, Categories, Tags, Settings, Affiliates, Comments, Messages, Media, Redirects, ContentAudit

#### `/src/app/lib/`
Utility functions:
- `api.ts` - Centralized API client for all backend calls
- `seo-utils.ts` - SEO scoring and analysis
- `health.ts` - Health monitoring system
- `migrations.ts` - Data migration utilities
- `version.ts` - Version tracking

#### `/supabase/functions/server/`
Backend API (Hono web server):
- `index.tsx` - Main server with all routes (posts, categories, tags, affiliates, comments, messages, subscribers, redirects, media)

---

## ⚙️ Configuration

### Site Settings (`/admin/settings`)

#### General Settings
- **Site Name** - Displayed in header, meta tags, and structured data
- **Site Description** - Default meta description for homepage
- **Site URL** - Production URL for canonical links and sitemaps
- **Logo URL** - Site logo for branding

#### SEO Configuration
- **Google Analytics ID** - GA4 measurement ID (G-XXXXXXXXXX)
- **Google Search Console** - Verification meta tag
- **Default Meta Image** - Fallback OG image

#### Monetization
- **AdSense Enabled** - Toggle AdSense ads
- **AdSense Publisher ID** - Your ca-pub-XXXXXXXX ID
- **Affiliate Disclosure** - Enable automatic disclosure notices

#### Social Media
- **TikTok URL** - Link to your TikTok profile
- **Instagram URL** - Link to your Instagram profile
- **Facebook URL** - Link to your Facebook page
- **YouTube URL** - Link to your YouTube channel

*Note: Only configured social links appear in the footer*

### Environment Variables
Automatically configured by Supabase:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (server-side only)

---

## 🔍 SEO Optimization

### Real-Time SEO Scoring
The SEO panel provides live analysis with scores for:
- **Title Optimization** - Length, keyword presence
- **Meta Description** - Character count, keyword usage
- **Content Quality** - Word count (target: 1500+), readability
- **Keyword Density** - Focus keyword usage (target: 0.5-2.5%)
- **Heading Structure** - H1, H2, H3 hierarchy
- **Internal Links** - Link to related content (target: 2-5)
- **External Links** - Link to authoritative sources
- **Image Optimization** - Alt text, file names
- **URL Structure** - Short, descriptive slugs

### Structured Data (Schema.org)
Automatic JSON-LD markup for:
- **Article Schema** - For blog posts
- **FAQPage Schema** - For Q&A content
- **BreadcrumbList** - Navigation hierarchy
- **Organization** - Company information
- **Person** - Author profiles
- **Product** - Tool reviews and comparisons
- **WebSite** - Site-wide search action
- **CollectionPage** - Category and tag pages

### Technical SEO
- ✅ **XML Sitemap** - Auto-generated at `/sitemap.xml`
- ✅ **Robots.txt** - Available at `/robots.txt`
- ✅ **Canonical URLs** - Prevent duplicate content
- ✅ **Open Graph Tags** - Social media optimization
- ✅ **Twitter Cards** - Enhanced Twitter sharing
- ✅ **Mobile-First** - Responsive design for all devices
- ✅ **Fast Loading** - Code splitting, lazy loading, optimized images
- ✅ **Semantic HTML** - Proper HTML5 structure

### Content Guidelines for High Rankings
1. **Word Count** - Target 1,500+ words for long-form content
2. **Focus Keyword** - Use in title, first 100 words, H2/H3 headings
3. **Heading Hierarchy** - Use H2 for main sections, H3 for subsections
4. **Image Alt Text** - Describe every image for SEO and accessibility
5. **Internal Linking** - Link to 2-5 related posts
6. **External Links** - Link to 2-3 authoritative sources
7. **Meta Description** - Write compelling 150-160 character descriptions
8. **Readability** - Use short paragraphs, bullet points, clear language

---

## 💰 Monetization

### Google AdSense Integration

#### Setup
1. Get approved by Google AdSense
2. Copy your publisher ID (ca-pub-XXXXXXXX)
3. Add it in `/admin/settings`
4. Enable AdSense toggle
5. Ads automatically appear on article pages

#### Ad Placements
- **After First Paragraph** - High visibility
- **Mid-Article** - Balanced placement
- **End of Article** - After content consumption
- **Sidebar** - Desktop only, non-intrusive

#### Best Practices
- Enable AdSense only after approval
- Balance ads with user experience
- Monitor RPM and viewability in AdSense dashboard
- A/B test ad placements for optimal revenue

### Affiliate Link Management

#### Creating Affiliate Links
1. Go to `/admin/affiliates`
2. Click "New Affiliate Link"
3. Enter:
   - **Name** - Display name (e.g., "ChatGPT Pro")
   - **Slug** - URL-friendly identifier (e.g., "chatgpt")
   - **Target URL** - Your affiliate link (with tracking parameters)
   - **Description** - Optional notes for your reference
4. Save - Link becomes available at `/go/{slug}`

#### Using Affiliate Links
- **In Content** - Use `<AffiliateLink>` component or direct links
- **Travel Resources Page** - Showcase travel tools, gear, and affiliate CTAs
- **Button Blocks** - Add affiliate CTAs in blog posts
- **Navigation** - Link to featured tools from header/sidebar

#### Tracking Performance
- Navigate to `/admin/affiliates`
- View click counts for each link
- See referrer data (which pages drive clicks)
- Export data for deeper analysis

#### Compliance
- Enable "Affiliate Disclosure" in settings
- Automatic disclosure appears on posts with affiliate links
- Complies with FTC guidelines

---

## 📡 API Documentation

### Base URL
```
https://{projectId}.supabase.co/functions/v1/make-server-3713a632
```

### Authentication
Admin endpoints require Authorization header:
```
Authorization: Bearer {accessToken}
```

### Public Endpoints

#### Posts
```javascript
// List published posts (with pagination)
GET /posts?page=1&limit=12&status=published

// Get post by slug
GET /posts/slug/:slug

// Increment view count
POST /posts/:id/view

// Search posts
GET /posts?search=query
```

#### Categories & Tags
```javascript
// List all categories
GET /categories

// Get category by slug
GET /categories/slug/:slug

// List all tags
GET /tags

// Get tag by slug
GET /tags/slug/:slug
```

#### Affiliate Links
```javascript
// Track affiliate click and redirect
GET /affiliates/redirect/:slug

// Track click with analytics
POST /affiliates/track/:slug
Body: { referrer: string }
```

#### Comments
```javascript
// List comments for a post
GET /comments?post_id={id}&status=approved

// Create comment (public)
POST /comments
Body: { post_id, content, author_name, author_email, parent_id? }
```

#### Contact & Subscriptions
```javascript
// Submit contact message
POST /messages
Body: { name, email, message }

// Subscribe to newsletter
POST /subscribers
Body: { email }
```

#### Redirects
```javascript
// Check for redirect
GET /redirects/check?path=/old-url
```

### Admin Endpoints (Require Authentication)

#### Posts Management
```javascript
// Create post
POST /posts
Body: { title, slug, content, status, ... }

// Update post
PUT /posts/:id
Body: { title, content, status, ... }

// Delete post
DELETE /posts/:id

// Bulk delete posts
POST /posts/bulk-delete
Body: { ids: string[] }
```

#### Media Management
```javascript
// List media
GET /media

// Upload media (multipart/form-data)
POST /media/upload
Body: FormData with 'file' field

// Delete media
DELETE /media/:id
```

#### Comments Moderation
```javascript
// Update comment status
PUT /comments/:id
Body: { status: 'approved' | 'pending' | 'spam' }

// Delete comment
DELETE /comments/:id
```

#### Analytics
```javascript
// Dashboard stats
GET /analytics/dashboard

// Top posts
GET /analytics/top-posts?limit=10
```

---

## 🌐 Deployment

### Pre-Deployment Checklist
- [ ] Configure site settings (name, URL, description)
- [ ] Set up custom domain
- [ ] Enable SSL certificate (HTTPS)
- [ ] Configure Google Analytics
- [ ] Verify Google Search Console
- [ ] Submit sitemap to Google (`/sitemap.xml`)
- [ ] Test all pages on mobile devices
- [ ] Create 10+ quality posts
- [ ] Set up social media profiles
- [ ] Enable AdSense (after approval)
- [ ] Test affiliate links

### Deployment Steps
1. **Build Application**
   ```bash
   npm run build:ssg
   ```

2. **Deploy to Hosting**
   - Platform deploys automatically via Figma Make
   - Ensure environment variables are set

3. **Configure DNS**
   - Point your domain to deployment URL
   - Set up SSL certificate

4. **Post-Deployment**
   - Test all routes (`/`, `/blog`, `/admin`, `/about`, `/contact`)
   - Verify admin authentication works
   - Check AdSense ads appear (if enabled)
   - Test affiliate link redirects
   - Verify sitemap is accessible
   - Submit sitemap to Google Search Console

### Performance Optimization
- **Code Splitting** - Lazy loading for all public pages
- **Image Optimization** - Lazy loading images with `loading="lazy"`
- **CDN** - Use Supabase Storage CDN for images
- **Caching** - Browser caching via headers
- **Minification** - Vite handles JS/CSS minification
- **Compression** - Enable gzip/brotli on server

---

## 🐛 Troubleshooting

### Common Issues

#### "Unauthorized" errors in admin
- **Cause**: Not logged in or session expired
- **Solution**: Go to `/admin/login` and sign in again
- **Check**: Ensure Supabase Auth user is confirmed

#### Posts not showing on homepage
- **Cause**: Post not published or missing `published_at` date
- **Solution**: Edit post, set status to "published" and add publish date

#### Images not uploading
- **Cause**: Supabase Storage not configured or file too large
- **Solution**: 
  - Check Supabase Storage is enabled
  - Ensure file size under 10MB
  - Check browser console for specific errors

#### Low SEO score
- **Causes**: Missing elements
- **Solutions**:
  - Add focus keyword in SEO panel
  - Use keyword in title and first paragraph
  - Add H2/H3 headings with keyword variations
  - Include 2-5 internal links
  - Add alt text to all images
  - Aim for 1,500+ words

#### Comments not appearing
- **Cause**: Comments pending approval or spam filtered
- **Solution**: Go to `/admin/comments` and approve pending comments

#### Affiliate links not tracking
- **Cause**: JavaScript disabled or ad blocker
- **Solution**: Test in incognito mode without extensions

#### Health monitoring alerts
- **Cause**: Backend, database, or localStorage issues
- **Solution**: 
  - Check Supabase dashboard for service status
  - Clear browser cache/localStorage
  - Check browser console for errors
  - Review System Status at `/admin` (bottom of dashboard)

### Debug Mode
Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

### Getting Help
1. Check browser console for errors (F12)
2. Review Supabase logs in dashboard
3. Test in incognito mode to rule out extensions
4. Check System Status dashboard at `/admin`
5. Verify all environment variables are set

---

## 📚 Additional Resources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)

### SEO Resources
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Validator](https://validator.schema.org)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev)

### Monetization
- [Google AdSense Help](https://support.google.com/adsense)
- [FTC Affiliate Marketing Guidelines](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers)

---

## 🎯 Best Practices

### Content Strategy
1. **Publish Consistently** - Aim for 2-4 posts per week
2. **Keyword Research** - Target long-tail keywords with search intent
3. **Content Depth** - Create comprehensive 1,500+ word guides
4. **Update Regularly** - Refresh old content to maintain rankings
5. **Internal Linking** - Build content clusters around topics
6. **Multimedia** - Include images, videos, infographics
7. **CTAs** - Add newsletter signup and affiliate CTAs

### SEO Maintenance
- Monitor Google Search Console weekly
- Update old posts quarterly
- Fix broken links monthly
- Submit new content to Google via sitemap
- Track keyword rankings
- Analyze user behavior in Google Analytics

### Performance Monitoring
- Test site speed monthly (PageSpeed Insights)
- Monitor Core Web Vitals
- Check mobile usability
- Review error logs weekly
- Monitor uptime and availability

---

## 📊 Features in Detail

### Comment System
- **Nested Replies** - Up to 3 levels deep
- **Spam Detection** - Automatic spam filtering
- **Moderation** - Approve, reject, or mark as spam
- **Email Notifications** - Optional (extend with email service)
- **Guest Comments** - No registration required

### Redirect System
- **301 Redirects** - Permanent redirects for SEO
- **302 Redirects** - Temporary redirects
- **Hit Tracking** - Count redirects for analytics
- **Bulk Management** - Create/edit/delete multiple redirects

### Health Monitoring
- **Backend Health** - Check API availability
- **Database Health** - Verify KV store connectivity
- **localStorage Health** - Ensure client storage works
- **Auto-Retry** - Exponential backoff for failed requests
- **Error Logging** - Detailed error messages in console

### Content Audit
- **SEO Scores** - Review SEO scores for all posts
- **Performance** - Identify low-performing content
- **Optimization** - Bulk optimize meta tags
- **Analytics** - View and engagement metrics

---

## 🔐 Security

### Authentication
- Supabase Auth with email/password
- Optional OAuth (Google, Facebook, GitHub)
- JWT-based session management
- Secure password hashing

### Authorization
- Admin routes require authentication
- Service role key never exposed to frontend
- All mutations require valid session
- Row-level security (if using Postgres)

### Data Protection
- XSS protection with content sanitization
- CORS configured for security
- File upload validation
- SQL injection prevention (KV store abstraction)

---

## 🤝 Contributing

This is a production blogging platform. For customization:
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start development: `pnpm dev`
4. Make changes in `/src/app/`
5. Test thoroughly before deploying

---

## 📄 License

This project is part of Figma Make and follows its licensing terms.

---

## 🎉 Get Started Now!

1. **Create your admin account** in Supabase Auth and add the email to ADMIN_EMAILS
2. **Configure site settings** at `/admin/settings`
3. **Publish your first post** at `/admin/posts/new`
4. **Start ranking on Google!** 🚀

---

**Built with ❤️ for travel content creators**

Transform your travel expertise into a thriving blog with world-class SEO and monetization features.

## Production security notes

This package has been updated to avoid committing Supabase credentials. Configure these values in your hosting provider/environment instead of source files:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`
- `ADMIN_EMAILS`
- `OPENAI_API_KEY` if using AI generation

Admin API routes now require a valid Supabase user JWT. If `ADMIN_EMAILS` is set, only those comma-separated email addresses can access admin operations. Public endpoints remain available for published content, comments, contact messages, subscribers, health checks, redirects, and affiliate tracking.
