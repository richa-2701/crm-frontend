"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Autocomplete } from "@/components/ui/autocomplete"
import { api, type ApiDemo, type ApiLead } from "@/lib/api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Loader2, Mic, MicOff, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function PostDemoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [allLeads, setAllLeads] = useState<ApiLead[]>([])
  const [scheduledDemos, setScheduledDemos] = useState<ApiDemo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [formData, setFormData] = useState({
    demo_id: "",
    lead_id: "",
    remark: "",
    // --- START OF CHANGE: Add duration_minutes to form state ---
    duration_minutes: "",
    // --- END OF CHANGE ---
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast({ title: "Microphone Error", description: "Could not access microphone.", variant: "destructive" });
    }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "lead_id") {
      const demosForLead = scheduledDemos.filter((d) => String(d.lead_id) === value);
      if (demosForLead.length > 0) {
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
    if (!formData.demo_id || !formData.remark || !formData.duration_minutes) {
        toast({ title: "Error", description: "Please select a scheduled demo, enter notes, and provide the duration.", variant: "destructive" });
        return;
    }
    setIsLoading(true);

    try {
        const duration = Number.parseInt(formData.duration_minutes, 10);
        if (isNaN(duration) || duration <= 0) {
            toast({ title: "Error", description: "Please enter a valid duration.", variant: "destructive" });
            setIsLoading(false);
            return;
        }

      // --- START OF CHANGE: Updated the payload to include DurationMinutes ---
      const demoData = {
        DemoId: Number.parseInt(formData.demo_id),
        Remark: formData.remark,
        DurationMinutes: duration,
      }
      // --- END OF CHANGE ---
      
      await api.completeDemo(demoData);

      // Upload MOM audio if recorded
      if (audioBlob) {
        setIsUploadingAudio(true);
        try {
          const audioFile = new File([audioBlob], "demo-mom.webm", { type: "audio/webm" });
          await api.uploadDemoMOM(Number(formData.demo_id), audioFile);
        } catch (audioErr) {
          console.error("Failed to upload MOM audio:", audioErr);
        } finally {
          setIsUploadingAudio(false);
        }
      }

      setShowConfirmation(true)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Error", description: `Failed to save demo notes: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmation = () => {
    setShowConfirmation(false)
    router.push("/dashboard")
  }
  
  const isPrefilled = !!searchParams.get('leadId');
  
  const leadsWithOptions = isPrefilled 
    ? allLeads.filter(l => l.id.toString() === formData.lead_id) 
    : allLeads.filter(lead => scheduledDemos.some(demo => String(demo.lead_id) === String(lead.id)));

  const leadOptions = leadsWithOptions.map((lead) => ({ value: String(lead.id), label: lead.company_name }));

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

            {/* --- START OF CHANGE: Add duration input field --- */}
            <div className="space-y-2">
                <Label htmlFor="duration_minutes">Actual Duration (minutes) *</Label>
                <Input
                    id="duration_minutes"
                    type="number"
                    placeholder="e.g., 60"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange("duration_minutes", e.target.value)}
                    required
                    min="1"
                />
            </div>
            {/* --- END OF CHANGE --- */}

            <div className="space-y-2">
              <Label htmlFor="remark">Demo Notes *</Label>
              <Textarea id="remark" placeholder="Enter demo notes and client feedback..." value={formData.remark} onChange={(e) => handleInputChange("remark", e.target.value)} rows={5} required />
            </div>
            {/* MOM Audio Recording */}
            <div className="space-y-2 rounded-lg border p-3">
              <Label className="text-sm font-medium">MOM Audio Recording (optional)</Label>
              <p className="text-xs text-muted-foreground">Record a voice note as Minutes of Meeting</p>
              {!audioUrl ? (
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={isRecording ? stopRecording : startRecording}
                  className="h-9 text-sm gap-2"
                >
                  {isRecording ? <><MicOff className="h-4 w-4" /> Stop Recording</> : <><Mic className="h-4 w-4" /> Start Recording</>}
                </Button>
              ) : (
                <div className="space-y-2">
                  <audio controls src={audioUrl} className="w-full h-10" />
                  <Button type="button" variant="ghost" size="sm" onClick={discardRecording} className="text-destructive hover:text-destructive gap-1 text-xs">
                    <Trash2 className="h-3 w-3" /> Discard Recording
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isLoading || isUploadingAudio || !formData.demo_id}>
                {(isLoading || isUploadingAudio) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploadingAudio ? "Uploading Audio..." : "Save Notes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ConfirmationDialog open={showConfirmation} onOpenChange={setShowConfirmation} title="Success" message="Demo has been marked as done." onConfirm={handleConfirmation} />
    </div>
  )
}