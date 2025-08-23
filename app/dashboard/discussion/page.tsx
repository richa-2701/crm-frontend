// frontend/app/dashboard/discussion/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogDiscussionForm } from "@/components/discussions/log-discussion-form";
import { ScheduleDiscussionForm } from "@/components/discussions/schedule-discussion-form";
import { DiscussionDoneForm } from "@/components/discussions/discussion-done-form";
import { ApiUser } from "@/lib/api";

export default function DiscussionPage() {
    const [user, setUser] = useState<ApiUser | null>(null);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            router.push("/login");
        }
    }, [router]);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Discussion Management</h1>
                <p className="text-muted-foreground">Log, schedule, or complete discussions with your leads.</p>
            </div>

            <Tabs defaultValue="log" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="log">Log a Past Discussion</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule a Future Discussion</TabsTrigger>
                    <TabsTrigger value="done">Mark as Done</TabsTrigger>
                </TabsList>
                <TabsContent value="log">
                    <LogDiscussionForm currentUser={user} />
                </TabsContent>
                <TabsContent value="schedule">
                    <ScheduleDiscussionForm currentUser={user} />
                </TabsContent>
                <TabsContent value="done">
                    <DiscussionDoneForm currentUser={user} />
                </TabsContent>
            </Tabs>
        </div>
    );
}