import SettingsForm from "@/components/settings/SettingsForm";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { User, ChevronRight, Bell, Shield, Trash2, HelpCircle, LogOut, MessageSquare, UserCog } from "lucide-react";
import { useLocation } from "wouter";

export default function Settings() {
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [, setLocation] = useLocation();
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Make a request to the logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear any stored tokens
      localStorage.removeItem('token');
      
      // Clear React Query cache
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to login page
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  const handleClearData = () => {
    // In a real app, we would make an API call to clear user data
    toast({
      title: "Data cleared",
      description: "All your data has been cleared successfully",
      variant: "default",
    });
    setIsConfirmDialogOpen(false);
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Account Section */}
        <div className="bg-blue-950 border border-blue-900 rounded-xl p-6 shadow-md">
          <h3 className="font-medium text-white text-lg mb-5">Account</h3>
          
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center mr-4 border border-purple-800/30">
              <User className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white">User</p>
              <p className="text-sm text-gray-400">user@example.com</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button className="w-full py-3 px-4 text-left text-sm text-white flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              <div className="flex items-center">
                <UserCog className="h-4 w-4 mr-3 text-gray-400" />
                <span>Edit Profile</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button className="w-full py-3 px-4 text-left text-sm text-white flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-3 text-gray-400" />
                <span>Change Password</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button className="w-full py-3 px-4 text-left text-sm text-white flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              <div className="flex items-center">
                <Bell className="h-4 w-4 mr-3 text-gray-400" />
                <span>Notification Preferences</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Voice Assistant Section */}
        <div className="bg-blue-950 border border-blue-900 rounded-xl p-6 shadow-md">
          <h3 className="font-medium text-white text-lg mb-5">Voice Assistant</h3>
          <SettingsForm />
        </div>
        
        {/* Privacy Section */}
        <div className="bg-blue-950 border border-blue-900 rounded-xl p-6 shadow-md">
          <h3 className="font-medium text-white text-lg mb-5">Privacy & Data</h3>
          
          <div className="space-y-4">
            <button className="w-full py-3 px-4 text-left text-sm text-white flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-3 text-gray-400" />
                <span>Data & Privacy Policy</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button 
              className="w-full py-3 px-4 text-left text-sm text-red-400 flex items-center justify-between bg-red-900/20 hover:bg-red-900/30 rounded-lg transition-colors border border-red-900/30"
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              <div className="flex items-center">
                <Trash2 className="h-4 w-4 mr-3 text-red-400" />
                <span>Clear All Data</span>
              </div>
              <ChevronRight className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
        
        {/* About Section */}
        <div className="bg-blue-950 border border-blue-900 rounded-xl p-6 shadow-md">
          <h3 className="font-medium text-white text-lg mb-5">About</h3>
          
          <div className="space-y-3">
            <div className="text-sm mb-4">
              <p className="text-gray-400">Version 1.0.0</p>
            </div>
            
            <button className="w-full py-3 px-4 text-left text-sm text-white flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-3 text-gray-400" />
                <span>Terms of Service</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button className="w-full py-3 px-4 text-left text-sm text-white flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              <div className="flex items-center">
                <HelpCircle className="h-4 w-4 mr-3 text-gray-400" />
                <span>Help & Support</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button className="w-full py-3 px-4 text-left text-sm text-white flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-3 text-gray-400" />
                <span>Send Feedback</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Sign Out Button */}
        <Button 
          variant="outline" 
          className="w-full py-4 bg-blue-950 hover:bg-blue-900 text-red-400 font-medium rounded-xl border border-blue-900 transition-colors flex items-center justify-center gap-2 shadow-md"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-5 w-5" />
          {isLoggingOut ? "Signing Out..." : "Sign Out"}
        </Button>
      </div>
      
      {/* Confirm Clear Data Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="bg-blue-950 border border-blue-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Clear All Data</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This action cannot be undone. This will permanently delete all your conversations, tasks, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-900 border-gray-800 text-white hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearData}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}