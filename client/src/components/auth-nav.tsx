import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, User, LogOut, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { getAuthUser, clearAuthUser } from "@/lib/auth";

export default function AuthNav() {
  const [, setLocation] = useLocation();
  const currentUser = getAuthUser();

  if (!currentUser) {
    return (
      <Button
        onClick={() => setLocation("/")}
        variant="outline"
        size="sm"
      >
        Login
      </Button>
    );
  }

  const handleLogout = () => {
    clearAuthUser();
    setLocation("/");
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
        {currentUser.isAdmin ? (
          <Shield className="w-4 h-4 text-blue-500" />
        ) : (
          <User className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-sm font-medium">
          {currentUser.fullName || currentUser.username}
        </span>
        {currentUser.isAdmin && (
          <Badge variant="secondary" className="text-xs">
            Admin
          </Badge>
        )}
      </div>
      
      {currentUser.isAdmin && (
        <Button
          onClick={() => setLocation("/admin")}
          variant="outline"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-1" />
          Admin
        </Button>
      )}
      
      <Button
        onClick={handleLogout}
        variant="outline"
        size="sm"
      >
        <LogOut className="w-4 h-4 mr-1" />
        Logout
      </Button>
    </div>
  );
}