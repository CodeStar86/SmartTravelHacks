import { createBrowserRouter, Outlet } from 'react-router';
import type { ComponentType } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import RedirectHandler from './components/public/RedirectHandler';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import ArticlePage from './pages/ArticlePage';
import CategoryPage from './pages/CategoryPage';
import TagPage from './pages/TagPage';
import TravelResourcesPage from './pages/BestAIToolsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import AffiliateDisclosurePage from './pages/AffiliateDisclosurePage';
import NotFoundPage from './pages/NotFoundPage';
import AffiliateRedirect from './pages/AffiliateRedirect';
import SitemapPage from './pages/SitemapPage';
import RobotsPage from './pages/RobotsPage';
import AdminLayout from './pages/admin/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPosts from './pages/admin/Posts';
import AdminPostEditor from './pages/admin/PostEditor';
import AdminCategories from './pages/admin/Categories';
import AdminTags from './pages/admin/Tags';
import AdminSubscribers from './pages/admin/Subscribers';
import AdminMessages from './pages/admin/Messages';
import AdminComments from './pages/admin/Comments';
import AdminMedia from './pages/admin/Media';
import AdminSettings from './pages/admin/Settings';
import AdminAffiliates from './pages/admin/Affiliates';
import AdminContentAudit from './pages/admin/ContentAudit';
import AdminRedirects from './pages/admin/Redirects';
import AdminLogin from './pages/admin/Login';
import TestAuth from './pages/admin/TestAuth';

function RootLayout() {
  return (
    <SettingsProvider>
      <Outlet />
    </SettingsProvider>
  );
}

const withRedirect = (Component: ComponentType) => (
  <RedirectHandler>
    <Component />
  </RedirectHandler>
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: withRedirect(HomePage) },
      { path: '/blog', element: withRedirect(BlogPage) },
      { path: '/blog/:slug', element: withRedirect(ArticlePage) },
      { path: '/category/:slug', element: withRedirect(CategoryPage) },
      { path: '/where-to-go/:slug', element: withRedirect(CategoryPage) },
      { path: '/plan-your-trip/:slug', element: withRedirect(CategoryPage) },
      { path: '/tag/:slug', element: withRedirect(TagPage) },
      { path: '/travel-resources', element: withRedirect(TravelResourcesPage) },
      { path: '/about', element: withRedirect(AboutPage) },
      { path: '/contact', element: withRedirect(ContactPage) },
      { path: '/privacy', element: withRedirect(PrivacyPage) },
      { path: '/affiliate-disclosure', element: withRedirect(AffiliateDisclosurePage) },
      { path: '/go/:slug', element: <AffiliateRedirect /> },
      { path: '/sitemap.xml', element: <SitemapPage /> },
      { path: '/robots.txt', element: <RobotsPage /> },
      { path: '/admin/login', element: <AdminLogin /> },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'posts', element: <AdminPosts /> },
          { path: 'posts/new', element: <AdminPostEditor /> },
          { path: 'posts/edit/:id', element: <AdminPostEditor /> },
          { path: 'categories', element: <AdminCategories /> },
          { path: 'tags', element: <AdminTags /> },
          { path: 'subscribers', element: <AdminSubscribers /> },
          { path: 'messages', element: <AdminMessages /> },
          { path: 'comments', element: <AdminComments /> },
          { path: 'media', element: <AdminMedia /> },
          { path: 'settings', element: <AdminSettings /> },
          { path: 'affiliates', element: <AdminAffiliates /> },
          { path: 'audit', element: <AdminContentAudit /> },
          { path: 'content-audit', element: <AdminContentAudit /> },
          { path: 'redirects', element: <AdminRedirects /> },
          { path: 'test-auth', element: <TestAuth /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
