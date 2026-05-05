import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { getCurrentUser, supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import {
  LayoutDashboard,
  FileText,
  Folder,
  Tag,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  Link as LinkIcon,
  BarChart3,
  ArrowRightLeft,
  Mail,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { categoryApi } from '../../lib/api';
import { cleanupLegacyAICategories } from '../../lib/category-utils';

export default function Layout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          navigate('/admin/login');
        } else if (session) {
          setUser(session.user);
          await cleanupLegacyAICategories(categoryApi.list, categoryApi.delete);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/admin/login');
      } else {
        setUser(currentUser);
        await cleanupLegacyAICategories(categoryApi.list, categoryApi.delete);
      }
    } catch (error) {
      logger.error('Auth check error:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      navigate('/admin/login');
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/posts', label: 'Posts', icon: FileText },
    { path: '/admin/content-audit', label: 'Content Audit', icon: BarChart3 },
    { path: '/admin/categories', label: 'Categories', icon: Folder },
    { path: '/admin/tags', label: 'Tags', icon: Tag },
    { path: '/admin/comments', label: 'Comments', icon: MessageCircle },
    { path: '/admin/subscribers', label: 'Subscribers', icon: Mail },
    { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { path: '/admin/media', label: 'Media', icon: Image },
    { path: '/admin/affiliates', label: 'Affiliate Links', icon: LinkIcon },
    { path: '/admin/redirects', label: 'Redirects', icon: ArrowRightLeft },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-900 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <h1 className="text-xl font-bold">Smart Travel Hacks</h1>
          <p className="text-sm text-gray-400 truncate">{user.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive(item.path, item.exact)
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-white"
            onClick={handleLogout}
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b h-16 flex items-center px-6 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-4"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          <div className="flex-1" />

          <Link
            to="/"
            target="_blank"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            View Site →
          </Link>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}