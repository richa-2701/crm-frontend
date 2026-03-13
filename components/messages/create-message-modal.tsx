// frontend/components/messages/create-message-modal.tsx
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, ApiUser, ApiMessageMasterCreatePayload } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface CreateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: ApiUser;
}

export function CreateMessageModal({ isOpen, onClose, onSuccess, currentUser }: CreateMessageModalProps) {
  const [formData, setFormData] = useState<Omit<ApiMessageMasterCreatePayload, 'created_by'>>({
    message_name: "",
    message_content: "",
    message_type: "text",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    if (field === "message_type") {
      setFile(null);
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      if (value === "text" || value === "text_media") {
        setFormData(prev => ({ ...prev, [field]: value }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value, message_content: "" }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const needsFile = formData.message_type === "media" || formData.message_type === "document" || formData.message_type === "text_media";
    if (needsFile && !file) {
      toast({ title: "File Required", description: "Please select a file for this message type.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await api.createMessage({ ...formData, created_by: currentUser.username }, file);
      toast({ title: "Success", description: "Message template created." });
      onSuccess();
      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Error", description: `Failed to create message: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ message_name: "", message_content: "", message_type: "text" });
    setFile(null);
    onClose();
  };

  const showText = formData.message_type === "text" || formData.message_type === "text_media";
  const showFile = formData.message_type !== "text";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Message Template</DialogTitle>
          <DialogDescription>
            Create a reusable message for text, media, or documents to use in drip sequences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message_name">Message Name</Label>
            <Input id="message_name" value={formData.message_name} onChange={e => handleInputChange("message_name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message_type">Message Type</Label>
            <Select value={formData.message_type} onValueChange={value => handleInputChange("message_type", value)}>
              <SelectTrigger id="message_type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="media">Media (Image/Video)</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="text_media">Text + Media</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {showText && (
            <div className="space-y-2">
              <Label htmlFor="message_content">Message Content</Label>
              <Textarea
                id="message_content"
                value={formData.message_content || ''}
                onChange={e => handleInputChange("message_content", e.target.value)}
                rows={5}
                placeholder="Type your message here... You can use {contact_name} as a placeholder."
              />
            </div>
          )}
          {showFile && (
            <div className="space-y-2">
              <Label htmlFor="file">File Attachment</Label>
              <Input id="file" type="file" onChange={handleFileChange} required={formData.message_type !== "text_media"} />
              {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
