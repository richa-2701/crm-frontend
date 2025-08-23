"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, ApiMessageMaster } from "@/lib/api";

interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message: ApiMessageMaster;
}

export function EditMessageModal({ isOpen, onClose, onSuccess, message }: EditMessageModalProps) {
  const [formData, setFormData] = useState({
    message_name: "",
    message_content: "",
    message_type: "text" as 'text' | 'media' | 'document',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (message) {
      setFormData({
        message_name: message.message_name,
        message_content: message.message_content || "",
        message_type: message.message_type,
      });
    }
  }, [message]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.updateMessage(message.id, formData);
      toast({ title: "Success", description: "Message template updated." });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update message.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Message Template</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields are identical to the create modal */}
            <div className="space-y-2">
                <Label htmlFor="edit_message_name">Message Name</Label>
                <Input id="edit_message_name" value={formData.message_name} onChange={e => handleInputChange("message_name", e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit_message_type">Message Type</Label>
                <Select value={formData.message_type} onValueChange={value => handleInputChange("message_type", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {formData.message_type === 'text' && (
                <div className="space-y-2">
                    <Label htmlFor="edit_message_content">Message Content</Label>
                    <Textarea id="edit_message_content" value={formData.message_content} onChange={e => handleInputChange("message_content", e.target.value)} rows={5} />
                </div>
            )}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? "Saving Changes..." : "Save Changes"}</Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}