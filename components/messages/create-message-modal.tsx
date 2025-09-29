// frontend/components/messages/create-message-modal.tsx
"use client";
import { useState } from "react";
// --- CHANGE: Import DialogDescription ---
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
      
      if (value === "text") {
        setFormData(prev => ({ ...prev, [field]: value }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value, message_content: "" }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.message_type !== 'text' && !file) {
        toast({ title: "File Required", description: "Please select a file for media or document message types.", variant: "destructive" });
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
    setFormData({
      message_name: "",
      message_content: "",
      message_type: "text",
    });
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Message Template</DialogTitle>
          {/* --- CHANGE: Add DialogDescription to fix console warning --- */}
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
              </SelectContent>
            </Select>
          </div>
          {formData.message_type === "text" ? (
            <div className="space-y-2">
              <Label htmlFor="message_content">Message Content</Label>
              <Textarea id="message_content" value={formData.message_content || ''} onChange={e => handleInputChange("message_content", e.target.value)} rows={5} placeholder="Type your message here... You can use {contact_name} as a placeholder."/>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="file">File Attachment</Label>
              <Input id="file" type="file" onChange={handleFileChange} required />
              {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Message"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}