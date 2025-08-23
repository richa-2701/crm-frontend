// frontend/app/dashboard/message-master/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, ApiMessageMaster, ApiUser } from "@/lib/api";
import { MessagesTable } from "@/components/messages/messages-table";
import { CreateMessageModal } from "@/components/messages/create-message-modal";
import { EditMessageModal } from "@/components/messages/edit-message-modal";

export default function MessageMasterPage() {
    const [user, setUser] = useState<ApiUser | null>(null);
    const [messages, setMessages] = useState<ApiMessageMaster[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ApiMessageMaster | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const data = await api.getMessages();
            setMessages(data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch messages.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this message template? This action cannot be undone.")) {
            try {
                await api.deleteMessage(id);
                toast({ title: "Success", description: "Message deleted successfully." });
                fetchMessages();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete message.", variant: "destructive" });
            }
        }
    };
    
    const handleEdit = (message: ApiMessageMaster) => {
        setSelectedMessage(message);
        setIsEditModalOpen(true);
    };

    const filteredMessages = messages.filter(m =>
        m.message_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.message_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Message Master</h1>
                    <p className="text-muted-foreground">Manage your reusable message templates for drip sequences.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Message
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search messages by name or code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
                    </div>
                </CardHeader>
                <CardContent>
                    <MessagesTable messages={filteredMessages} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
                </CardContent>
            </Card>
            <CreateMessageModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchMessages}
                currentUser={user}
            />
            {selectedMessage && (
                <EditMessageModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={fetchMessages}
                    message={selectedMessage}
                />
            )}
        </div>
    );
}