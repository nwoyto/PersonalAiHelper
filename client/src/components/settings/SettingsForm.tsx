import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  alwaysListening: z.boolean().default(true),
  wakeWord: z.string().min(1, "Wake word is required"),
  voiceGender: z.enum(["female", "male", "neutral"]),
  saveConversations: z.boolean().default(true),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsForm() {
  const { toast } = useToast();
  
  // Fetch current settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["/api/settings"],
    retry: false,
  });
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      alwaysListening: true,
      wakeWord: "Hey Assistant",
      voiceGender: "female",
      saveConversations: true,
    },
  });
  
  // Update form when settings are loaded
  useEffect(() => {
    if (settings && typeof settings === 'object') {
      const settingsObj = settings as {
        alwaysListening?: boolean;
        wakeWord?: string;
        voiceGender?: 'female' | 'male' | 'neutral';
        saveConversations?: boolean;
      };
      
      form.reset({
        alwaysListening: settingsObj.alwaysListening ?? true,
        wakeWord: settingsObj.wakeWord ?? 'Hey Assistant',
        voiceGender: (settingsObj.voiceGender as 'female' | 'male' | 'neutral') ?? 'female',
        saveConversations: settingsObj.saveConversations ?? true,
      });
    }
  }, [settings, form]);
  
  // Mutation for updating settings
  const mutation = useMutation({
    mutationFn: (data: SettingsFormValues) => {
      return apiRequest("PATCH", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully",
        variant: "default",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to update settings",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SettingsFormValues) => {
    mutation.mutate(data);
  };
  
  if (isLoading) {
    return (
      <div className="py-4 text-center text-text-secondary">
        Loading settings...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-4 text-center text-error">
        Error loading settings: {(error as Error).message}
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="alwaysListening"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-x-2 rounded-lg border border-gray-900 p-5 bg-gray-900">
              <div className="space-y-1">
                <FormLabel className="text-base text-white">Always Listening Mode</FormLabel>
                <FormDescription className="text-sm text-gray-300">
                  Automatically detect wake word and process speech in the background
                </FormDescription>
                {typeof window !== 'undefined' && window.location.hostname.includes('replit') && (
                  <p className="text-xs text-amber-400 mt-2 bg-amber-900/20 p-2 rounded-md border border-amber-800/30">
                    Note: Always-on listening is designed to run in production environments.
                    Some browsers may limit this functionality in development environments.
                  </p>
                )}
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-800"
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="wakeWord"
          render={({ field }) => (
            <FormItem className="rounded-lg border border-gray-900 p-5 bg-gray-900">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <FormLabel className="text-base text-white">Wake Word</FormLabel>
                  <FormDescription className="text-sm text-gray-300">
                    Word to activate the assistant
                  </FormDescription>
                </div>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-40 bg-gray-800 border-gray-800 text-white">
                      <SelectValue placeholder="Select wake word" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-900 text-white">
                      <SelectItem value="Hey Assistant">Hey Assistant</SelectItem>
                      <SelectItem value="OK Voice">OK Voice</SelectItem>
                      <SelectItem value="Listen Up">Listen Up</SelectItem>
                      <SelectItem value="Custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </div>
              
              {field.value === "Custom" && (
                <Input
                  placeholder="Enter custom wake word"
                  className="mt-3 bg-gray-800 border-gray-800 text-white"
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="voiceGender"
          render={({ field }) => (
            <FormItem className="rounded-lg border border-gray-900 p-5 bg-gray-900">
              <div className="flex justify-between items-center">
                <div>
                  <FormLabel className="text-base text-white">Voice Gender</FormLabel>
                  <FormDescription className="text-sm text-gray-300">
                    Assistant's voice type
                  </FormDescription>
                </div>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-40 bg-gray-800 border-gray-800 text-white">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-900 text-white">
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="saveConversations"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-x-2 rounded-lg border border-gray-900 p-5 bg-gray-900">
              <div className="space-y-1">
                <FormLabel className="text-base text-white">Save Conversations</FormLabel>
                <FormDescription className="text-sm text-gray-300">
                  Store conversation history
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-800"
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3 mt-4 shadow-md"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Form>
  );
}
