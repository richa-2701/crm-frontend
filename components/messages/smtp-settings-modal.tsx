// frontend/components/messages/smtp-settings-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

interface SmtpSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SmtpSettingsModal({ isOpen, onClose }: SmtpSettingsModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [existingEmailId, setExistingEmailId] = useState<number | null>(null);
    const [existingPasswordId, setExistingPasswordId] = useState<number | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchSmtpSettings();
        }
    }, [isOpen]);

    const fetchSmtpSettings = async () => {
        setIsLoading(true);
        try {
            const settings = await api.getSmtpSettings();
            setEmail(settings.email || "");
            setPassword(settings.password || "");
            setExistingEmailId(settings.emailId);
            setExistingPasswordId(settings.passwordId);
        } catch (error) {
            console.error("Error fetching SMTP settings:", error);
            toast({
                title: "Error",
                description: "Failed to load SMTP settings.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!email.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter an email address.",
                variant: "destructive",
            });
            return;
        }

        if (!password.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter a password.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            const result = await api.saveSmtpSettings(
                email.trim(),
                password.trim(),
                existingEmailId,
                existingPasswordId
            );

            if (result.success) {
                toast({
                    title: "Success",
                    description: "SMTP settings saved successfully.",
                });
                onClose();
            } else {
                throw new Error("Failed to save settings");
            }
        } catch (error) {
            console.error("Error saving SMTP settings:", error);
            toast({
                title: "Error",
                description: "Failed to save SMTP settings.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure your SMTP email credentials for sending notifications, reminders, and drip campaigns.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="smtp-email">Sender Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="smtp-email"
                                    type="email"
                                    placeholder="your-email@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This email will be used as the sender for all outgoing emails.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="smtp-password">App Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="smtp-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter app password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                For Gmail, use an App Password instead of your regular password.
                                Generate one at: Google Account &gt; Security &gt; App passwords
                            </p>
                        </div>

                        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                            <p className="font-medium mb-1">Note:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>Leave empty to use default system email</li>
                                <li>Emails will be sent for lead assignments, reminders, and drip campaigns</li>
                            </ul>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Settings"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
