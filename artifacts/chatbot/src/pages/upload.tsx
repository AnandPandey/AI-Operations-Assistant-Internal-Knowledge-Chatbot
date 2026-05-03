import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, UploadCloud, FileText, Loader2 } from "lucide-react";
import { useUploadDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

const uploadSchema = z.object({
  name: z.string().min(1, "Document name is required").max(100),
  content: z.string().min(10, "Document content must be at least 10 characters"),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadDoc = useUploadDocument();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: "",
      content: "",
    },
  });

  const onSubmit = (data: UploadFormValues) => {
    uploadDoc.mutate(
      { data },
      {
        onSuccess: (newDoc) => {
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
          toast({
            title: "Document uploaded",
            description: "You can now ask questions about this document.",
          });
          setLocation("/");
        },
        onError: () => {
          toast({
            title: "Upload failed",
            description: "There was a problem uploading your document.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chat
          </Button>
        </Link>

        <div className="bg-card border rounded-xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <div className="bg-primary/10 p-3 rounded-lg text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Upload Document</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Add a new policy, guide, or text document for the assistant to learn from.
              </p>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 mb-8 flex gap-3">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <strong className="font-semibold block mb-1">How it works</strong>
              The assistant will answer questions <strong>only</strong> using the information in this document. It won't guess or use outside knowledge.
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Employee Handbook 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste the full text of your document here..." 
                        className="min-h-[250px] font-mono text-sm resize-y"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Plain text works best. Formatting will be stripped.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={uploadDoc.isPending}
                  className="w-full sm:w-auto shadow-sm"
                >
                  {uploadDoc.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
