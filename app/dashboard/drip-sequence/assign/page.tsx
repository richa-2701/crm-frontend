"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api, ApiDripSequenceList, ApiLead, ApiMasterData } from "@/lib/api";
import { ChevronLeft, Loader2, Search, Building2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AssignDripPage() {
    const [drips, setDrips] = useState<ApiDripSequenceList[]>([]);
    const [leads, setLeads] = useState<ApiLead[]>([]);
    const [statuses, setStatuses] = useState<ApiMasterData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Filters & Selection
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDripId, setSelectedDripId] = useState<string>("");
    const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
    
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [dripsData, leadsData, statusData] = await Promise.all([
                    api.getDripSequences(),
                    api.getAllLeads(),
                    api.getByCategory("status"),
                ]);
                setDrips(dripsData);
                setLeads(leadsData);
                setStatuses(statusData);
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch required data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus;
            const matchesSearch = 
                lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (lead.email || "").toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [leads, selectedStatus, searchQuery]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedLeadIds(filteredLeads.map(l => l.id));
        } else {
            setSelectedLeadIds([]);
        }
    };

    const toggleLeadSelection = (leadId: number) => {
        setSelectedLeadIds(prev => 
            prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
        );
    };

    const handleBulkAssign = async () => {
        if (!selectedDripId) {
            toast({ title: "Error", description: "Please select a drip sequence.", variant: "destructive" });
            return;
        }

        setIsAssigning(true);
        try {
            await api.bulkAssignDripToLeads(selectedLeadIds, parseInt(selectedDripId));
            toast({
                title: "Assigned Successfully",
                description: `Drip sequence has been assigned to ${selectedLeadIds.length} lead(s).`,
            });
            setSelectedLeadIds([]);
            setSelectedDripId("");
            setIsDialogOpen(false);
        } catch (error: any) {
            toast({ 
                title: "Assignment Failed", 
                description: error.message || "An error occurred during bulk assignment.", 
                variant: "destructive" 
            });
        } finally {
            setIsAssigning(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Professional Top Bar */}
            <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href="/dashboard/drip-sequence">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">Bulk Assign Drip</h1>
                        <p className="text-xs text-muted-foreground">Select leads and assign an automated message sequence.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {selectedLeadIds.length > 0 && (
                        <span className="text-sm font-medium text-muted-foreground">
                            {selectedLeadIds.length} selected
                        </span>
                    )}
                    <Button 
                        disabled={selectedLeadIds.length === 0}
                        onClick={() => setIsDialogOpen(true)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                    >
                        Assign Drip
                    </Button>
                </div>
            </div>

            {/* Filter Bar - Standard CRM style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 border-b bg-card shadow-sm">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search lead/company..." 
                        className="pl-8 h-9 text-sm" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statuses.map(s => (
                                <SelectItem key={s.id} value={s.value}>{s.value}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto px-6 py-4">
                <div className="border rounded-lg bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[50px] px-4">
                                    <Checkbox 
                                        checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                    />
                                </TableHead>
                                <TableHead className="text-xs uppercase font-semibold text-muted-foreground">Company</TableHead>
                                <TableHead className="text-xs uppercase font-semibold text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs uppercase font-semibold text-muted-foreground">Contact</TableHead>
                                <TableHead className="text-xs uppercase font-semibold text-muted-foreground">Assigned To</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                                        No leads found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <TableRow 
                                        key={lead.id} 
                                        className={`hover:bg-muted/30 transition-colors ${selectedLeadIds.includes(lead.id) ? "bg-primary/5" : ""}`}
                                    >
                                        <TableCell className="px-4">
                                            <Checkbox 
                                                checked={selectedLeadIds.includes(lead.id)}
                                                onCheckedChange={() => toggleLeadSelection(lead.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm text-foreground">{lead.company_name}</span>
                                                <span className="text-[10px] text-muted-foreground">{lead.lead_type || "No lead type"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal text-[10px] py-0 px-2 h-5">
                                                {lead.status || "New"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs">{lead.email || "No email"}</span>
                                                <span className="text-[10px] text-muted-foreground">{lead.phone_2 || "" }</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">{lead.assigned_to || "Unassigned"}</span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Selection Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Assignment Confirmation</DialogTitle>
                        <DialogDescription className="text-sm">
                            You are about to assign a drip sequence to <strong>{selectedLeadIds.length}</strong> selected leads.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Select Drip Sequence</label>
                            <Select value={selectedDripId} onValueChange={setSelectedDripId}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Choose a sequence..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {drips.map(d => (
                                        <SelectItem key={d.id} value={d.id.toString()}>
                                            {d.drip_name} ({d.drip_code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isAssigning} className="text-sm">
                            Cancel
                        </Button>
                        <Button onClick={handleBulkAssign} disabled={isAssigning || !selectedDripId} className="h-9 px-6">
                            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm & Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}