import SettingsForm from "@/components/settings/SettingsForm";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { ContentCard } from "@/components/ui/content-card";

export default function Settings() {
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
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
    <div className="settings-screen px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Header title="Settings" />
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Account Section */}
        <ContentCard>
          <h3 className="font-medium mb-4">Account</h3>
          
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-3">
              <i className="ri-user-line text-primary"></i>
            </div>
            <div>
              <p className="font-medium">User</p>
              <p className="text-sm text-text-secondary">user@example.com</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button className="w-full py-2 text-left text-sm flex items-center justify-between">
              <span>Edit Profile</span>
              <i className="ri-arrow-right-s-line"></i>
            </button>
            <button className="w-full py-2 text-left text-sm flex items-center justify-between">
              <span>Change Password</span>
              <i className="ri-arrow-right-s-line"></i>
            </button>
            <button className="w-full py-2 text-left text-sm flex items-center justify-between">
              <span>Notification Preferences</span>
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </ContentCard>
        
        {/* Voice Assistant Section */}
        <ContentCard>
          <h3 className="font-medium mb-4">Voice Assistant</h3>
          
          <SettingsForm />
        </ContentCard>
        
        {/* Privacy Section */}
        <ContentCard>
          <h3 className="font-medium mb-4">Privacy & Data</h3>
          
          <div className="space-y-4">
            <button className="w-full py-2 text-left text-sm flex items-center justify-between">
              <span>Data & Privacy Policy</span>
              <i className="ri-arrow-right-s-line"></i>
            </button>
            
            <button 
              className="w-full py-2 text-left text-sm flex items-center justify-between text-error"
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              <span>Clear All Data</span>
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
        </ContentCard>
        
        {/* About Section */}
        <ContentCard>
          <h3 className="font-medium mb-4">About</h3>
          
          <div className="space-y-3">
            <div className="text-sm">
              <p className="text-text-secondary">Version 1.0.0</p>
            </div>
            
            <button className="w-full py-2 text-left text-sm flex items-center justify-between">
              <span>Terms of Service</span>
              <i className="ri-arrow-right-s-line"></i>
            </button>
            
            <button className="w-full py-2 text-left text-sm flex items-center justify-between">
              <span>Help & Support</span>
              <i className="ri-arrow-right-s-line"></i>
            </button>
            
            <button className="w-full py-2 text-left text-sm flex items-center justify-between">
              <span>Send Feedback</span>
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </ContentCard>
        
        {/* Sign Out Button */}
        <Button 
          variant="outline" 
          className="w-full py-3 bg-surface text-error font-medium rounded-lg hover:bg-surface-light border-none"
        >
          Sign Out
        </Button>
      </div>
      
      {/* Confirm Clear Data Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="bg-surface border-surface-light">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your conversations, tasks, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-surface-light border-surface-light text-text-primary hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}