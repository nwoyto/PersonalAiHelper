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
    if (settings) {
      form.reset({
        alwaysListening: settings.alwaysListening,
        wakeWord: settings.wakeWord,
        voiceGender: settings.voiceGender,
        saveConversations: settings.saveConversations,
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
            <FormItem className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-surface">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Always Listening Mode</FormLabel>
                <FormDescription className="text-xs">
                  Automatically detect wake word
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="wakeWord"
          render={({ field }) => (
            <FormItem className="rounded-lg border p-4 bg-surface">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <FormLabel className="text-base">Wake Word</FormLabel>
                  <FormDescription className="text-xs">
                    Word to activate the assistant
                  </FormDescription>
                </div>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-36 bg-surface-light border-surface-light">
                      <SelectValue placeholder="Select wake word" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-surface-light">
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
                  className="mt-2 bg-surface-light border-surface-light"
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
            <FormItem className="rounded-lg border p-4 bg-surface">
              <div className="flex justify-between items-center">
                <div>
                  <FormLabel className="text-base">Voice Gender</FormLabel>
                  <FormDescription className="text-xs">
                    Assistant's voice type
                  </FormDescription>
                </div>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-36 bg-surface-light border-surface-light">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-surface-light">
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
            <FormItem className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-surface">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Save Conversations</FormLabel>
                <FormDescription className="text-xs">
                  Store conversation history
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-white"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Form>
  );
}
