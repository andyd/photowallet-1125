import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Github, CheckCircle2, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  name: z.string().min(1, "Repository name is required").max(100),
  description: z.string().max(350).optional(),
  isPrivate: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function GitHubSetup() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [repoData, setRepoData] = useState<{
    name: string;
    url: string;
    owner: string;
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "photo-wallet-pwa",
      description: "A privacy-focused Progressive Web App for storing cherished photos locally",
      isPrivate: false,
    },
  });

  async function onSubmit(values: FormData) {
    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/github/create-repo", values);
      const data = await response.json();

      setRepoData(data.repo);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create repository",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }

  if (repoData) {
    return (
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Repository Created Successfully!</CardTitle>
            </div>
            <CardDescription>Your code has been pushed to GitHub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Repository Name</p>
              <p className="font-medium" data-testid="text-repo-name">{repoData.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium" data-testid="text-repo-owner">{repoData.owner}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Repository URL</p>
              <a
                href={repoData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
                data-testid="link-repo-url"
              >
                {repoData.url}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <Button
              onClick={() => setRepoData(null)}
              variant="outline"
              className="w-full"
              data-testid="button-create-another"
            >
              Create Another Repository
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Github className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Create GitHub Repository</h1>
          <p className="text-muted-foreground">Push your Photo Wallet PWA to GitHub</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repository Details</CardTitle>
          <CardDescription>
            Configure your new GitHub repository and push your code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="my-awesome-repo"
                        data-testid="input-repo-name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose a unique name for your repository
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of your project"
                        className="resize-none"
                        data-testid="input-repo-description"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Help others understand what your project does
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Private Repository</FormLabel>
                      <FormDescription>
                        Make this repository private (visible only to you and collaborators)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-private"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isCreating}
                data-testid="button-create-repo"
              >
                {isCreating ? (
                  <>Creating Repository...</>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Create Repository & Push Code
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
