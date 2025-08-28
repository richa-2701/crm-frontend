"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogDiscussionForm } from "@/components/discussions/log-discussion-form";
import { ScheduleDiscussionForm } from "@/components/discussions/schedule-discussion-form";
import { DiscussionDoneForm } from "@/components/discussions/discussion-done-form";
import { ApiUser } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

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
                <Card>
                    {/* --- CHANGE 1: Revert to a fixed 3-column grid --- */}
                    <TabsList className="grid w-full grid-cols-3">
                        {/* --- CHANGE 2: Make the text inside each trigger responsive --- */}
                        <TabsTrigger value="log">
                            <span className="sm:hidden">Log</span>
                            <span className="hidden sm:inline">Log a Past Discussion</span>
                        </TabsTrigger>
                        <TabsTrigger value="schedule">
                            <span className="sm:hidden">Schedule</span>
                            <span className="hidden sm:inline">Schedule a Future Discussion</span>
                        </TabsTrigger>
                        <TabsTrigger value="done">
                            <span className="sm:hidden">Done</span>
                            <span className="hidden sm:inline">Mark as Done</span>
                        </TabsTrigger>
                    </TabsList>
                    <CardContent className="pt-6">
                        <TabsContent value="log" className="m-0">
                            <LogDiscussionForm currentUser={user} />
                        </TabsContent>
                        <TabsContent value="schedule" className="m-0">
                            <ScheduleDiscussionForm currentUser={user} />
                        </TabsContent>
                        <TabsContent value="done" className="m-0">
                            <DiscussionDoneForm currentUser={user} />
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}