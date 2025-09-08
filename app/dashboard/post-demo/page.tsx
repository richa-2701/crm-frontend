//frontend/app/dashboard/post-demo/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Autocomplete } from "@/components/ui/autocomplete"
import { api, type ApiDemo, type ApiLead } from "@/lib/api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Loader2 } from "lucide-react"

export default function PostDemoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [allLeads, setAllLeads] = useState<ApiLead[]>([])
  const [scheduledDemos, setScheduledDemos] = useState<ApiDemo[]>([])
  const [leads, setLeads] = useState<ApiLead[]>([])
  const [demos, setDemos] = useState<ApiDemo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false)

  const [formData, setFormData] = useState({
    demo_id: "",
    lead_id: "",
    remark: "",
  })

  useEffect(() => {
    const fetchData = async () => {
        setIsDataLoading(true);
      try {
        const [leadsData, demosData] = await Promise.all([
            api.getAllLeads(),
            api.getScheduledDemos()
        ]);
        setAllLeads(leadsData);
        setScheduledDemos(demosData);

        const leadIdFromUrl = searchParams.get('leadId');
        const demoIdFromUrl = searchParams.get('demoId');

        if (leadIdFromUrl && demoIdFromUrl) {
            setFormData(prev => ({
                ...prev,
                lead_id: leadIdFromUrl,
                demo_id: demoIdFromUrl,
            }));
        }

      } catch (error) {
        toast({ title: "Error", description: "Failed to load scheduled demos and leads.", variant: "destructive" });
      } finally {
          setIsDataLoading(false);
      }
    }
    fetchData()
  }, [toast, searchParams])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "lead_id") {
      const demosForLead = scheduledDemos.find((d) => String(d.lead_id) === value);
      if (demosForLead) {
        const latestDemo = demosForLead.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];
        setFormData((prev) => ({ ...prev, demo_id: String(latestDemo.id) }))
      } else {
        setFormData((prev) => ({ ...prev, demo_id: "" }))
        toast({ title: "Info", description: "This lead has no currently scheduled demos to complete." });
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.demo_id || !formData.remark) {
        toast({ title: "Error", description: "Please select a scheduled demo and enter notes.", variant: "destructive" });
        return;
    }
    setIsLoading(true);

    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const demoData = {
        demo_id: Number.parseInt(formData.demo_id),
        notes: formData.remark,
        updated_by: currentUser.username || "System",
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/demos/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoData),
      })
      if (!response.ok) {
        throw new Error(`Failed to complete demo: ${response.statusText}`)
      }
      
      setShowConfirmation(true)
    } catch (error) {
      toast({ title: "Error", description: "Failed to save demo notes.", variant: "destructive" });
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmation = () => {
    setShowConfirmation(false)
    router.push("/dashboard")
  }
  
  // --- THIS IS THE FIX ---
  const isPrefilled = !!searchParams.get('leadId');
  const leadOptions = (isPrefilled ? allLeads.filter(l => l.id.toString() === formData.lead_id) : allLeads)
    .map((lead) => ({ value: String(lead.id), label: lead.company_name }));

  if (isDataLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Post Demo</h1>
            <p className="text-muted-foreground">Record demo outcome and notes</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Demo Outcome</CardTitle>
          <CardDescription>Select the lead and enter the notes from your demo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lead_id">Lead Name *</Label>
              <Autocomplete
                options={leadOptions}
                value={formData.lead_id}
                onValueChange={(value) => handleInputChange("lead_id", value)}
                placeholder="Search and select a lead..."
                disabled={isPrefilled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remark">Demo Notes *</Label>
              <Textarea id="remark" placeholder="Enter demo notes and client feedback..." value={formData.remark} onChange={(e) => handleInputChange("remark", e.target.value)} rows={5} required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isLoading || !formData.demo_id}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ConfirmationDialog open={showConfirmation} onOpenChange={setShowConfirmation} title="Success" message="Demo has been marked as done." onConfirm={handleConfirmation} />
    </div>
  )
}