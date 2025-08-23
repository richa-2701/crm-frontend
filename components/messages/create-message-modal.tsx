"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, ApiUser, ApiMessageMasterCreatePayload } from "@/lib/api";

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.createMessage({ ...formData, created_by: currentUser.username });
      toast({ title: "Success", description: "Message template created." });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create message.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create New Message Template</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message_name">Message Name</Label>
            <Input id="message_name" value={formData.message_name} onChange={e => handleInputChange("message_name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message_type">Message Type</Label>
            <Select value={formData.message_type} onValueChange={value => handleInputChange("message_type", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.message_type === "text" ? (
            <div className="space-y-2">
              <Label htmlFor="message_content">Message Content</Label>
              <Textarea id="message_content" value={formData.message_content} onChange={e => handleInputChange("message_content", e.target.value)} rows={5} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="file">File Attach</Label>
              <Input id="file" type="file" disabled />
              <p className="text-xs text-muted-foreground">File uploads are not yet implemented.</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Message"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}