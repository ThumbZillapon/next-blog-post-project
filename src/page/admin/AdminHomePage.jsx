import { AdminSidebar } from "@/components/AdminWebSection";
import { useAuth } from "@/contexts/authentication";
import { FileText, FolderOpen, Users, BarChart3, Bug } from "lucide-react";
import { Link } from "react-router-dom";
import { checkUserRole, setUserRole } from "@/utils/checkUserRole";

export default function AdminHomePage() {
  const { state, fetchUser } = useAuth();

  const handleDebugRole = async () => {
    if (state.user?.id) {
      const result = await checkUserRole(state.user.id);
      console.log('Debug role check result:', result);
      alert(`Role check result: ${JSON.stringify(result, null, 2)}`);
    }
  };

  const handleSetAdminRole = async () => {
    if (state.user?.id) {
      const result = await setUserRole(state.user.id, 'admin');
      console.log('Set admin role result:', result);
      alert(`Set admin role result: ${JSON.stringify(result, null, 2)}`);
      
      // Refresh user data after setting role
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  };

  const handleRefreshUser = async () => {
    await fetchUser();
    window.location.reload();
  };

  const stats = [
    {
      title: "Total Articles",
      value: "12",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Categories",
      value: "5",
      icon: FolderOpen,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Users",
      value: "156",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Page Views",
      value: "2,847",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const quickActions = [
    {
      title: "Create New Article",
      description: "Write and publish a new blog post",
      link: "/admin/article-management/create",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Manage Categories",
      description: "Organize your content categories",
      link: "/admin/category-management",
      icon: FolderOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "View All Articles",
      description: "Edit and manage existing articles",
      link: "/admin/article-management",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main content */}
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {state.user?.name || 'Admin'}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your blog today.
            </p>
            
            {/* Debug Section */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Tools</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDebugRole}
                  className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
                >
                  <Bug className="inline w-4 h-4 mr-1" />
                  Check Role
                </button>
                <button
                  onClick={handleSetAdminRole}
                  className="px-3 py-1 bg-green-200 text-green-800 rounded text-sm hover:bg-green-300"
                >
                  Set Admin Role
                </button>
                <button
                  onClick={handleRefreshUser}
                  className="px-3 py-1 bg-blue-200 text-blue-800 rounded text-sm hover:bg-blue-300"
                >
                  Refresh User
                </button>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                Current role: {state.user?.role || 'undefined'}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                If you can't access Article Management or Category Management, click "Set Admin Role" to fix it.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className={`p-6 rounded-lg border-2 ${action.bgColor} ${action.borderColor} hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full ${action.bgColor}`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      New article "The Fascinating World of Cats" was published
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Category "Pet Care" was updated
                    </p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      User profile information was updated
                    </p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
