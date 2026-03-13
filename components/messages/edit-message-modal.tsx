// frontend/components/messages/edit-message-modal.tsx
"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, ApiMessageMaster, ApiMessageMasterUpdatePayload } from "@/lib/api";
import { Loader2, X } from "lucide-react";

interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message: ApiMessageMaster;
}

export function EditMessageModal({ isOpen, onClose, onSuccess, message }: EditMessageModalProps) {
  const [formData, setFormData] = useState<ApiMessageMasterUpdatePayload>({
    message_name: "",
    message_content: "",
    message_type: "text",
    existing_attachment_path: null,
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (message) {
      setFormData({
        message_name: message.message_name,
        message_content: message.message_content,
        message_type: message.message_type,
        existing_attachment_path: message.attachment_path,
      });
      setFile(null);
    }
  }, [message, isOpen]);

  const handleInputChange = (field: keyof ApiMessageMasterUpdatePayload, value: string) => {
    if (field === "message_type") {
      setFile(null);
      const fileInput = document.getElementById('edit_file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      if (value === "text" || value === "text_media") {
        setFormData(prev => ({ ...prev, [field]: value as ApiMessageMasterUpdatePayload["message_type"] }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value as ApiMessageMasterUpdatePayload["message_type"], existing_attachment_path: null }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected) setFormData(prev => ({ ...prev, existing_attachment_path: null }));
  };

  const handleRemoveAttachment = () => {
    setFile(null);
    setFormData(prev => ({ ...prev, existing_attachment_path: null }));
    const fileInput = document.getElementById('edit_file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const needsFile = formData.message_type === "media" || formData.message_type === "document" || formData.message_type === "text_media";
    if (needsFile && !file && !formData.existing_attachment_path) {
      toast({ title: "File Required", description: "Please select a file for this message type.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await api.updateMessage(message.id, formData, file);
      toast({ title: "Success", description: "Message template updated." });
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Error", description: `Failed to update message: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const showText = formData.message_type === "text" || formData.message_type === "text_media";
  const showFile = formData.message_type !== "text";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Message Template</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_message_name">Message Name</Label>
            <Input id="edit_message_name" value={formData.message_name} onChange={e => handleInputChange("message_name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_message_type">Message Type</Label>
            <Select value={formData.message_type} onValueChange={value => handleInputChange("message_type", value as ApiMessageMasterUpdatePayload["message_type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Label htmlFor="edit_message_content">Message Content</Label>
              <Textarea
                id="edit_message_content"
                value={formData.message_content || ''}
                onChange={e => handleInputChange("message_content", e.target.value)}
                rows={5}
                placeholder="Type your message here... You can use {contact_name} as a placeholder."
              />
            </div>
          )}
          {showFile && (
            <div className="space-y-2">
              <Label htmlFor="edit_file">File Attachment</Label>
              {formData.existing_attachment_path && (
                <div className="text-sm p-2 border rounded-md flex items-center justify-between bg-muted/50">
                  <span className="truncate pr-2" title={formData.existing_attachment_path}>
                    Current: {formData.existing_attachment_path.split('/').pop()}
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleRemoveAttachment}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              )}
              <Input id="edit_file" type="file" onChange={handleFileChange} />
              {file && <p className="text-xs text-muted-foreground">New: {file.name}</p>}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
