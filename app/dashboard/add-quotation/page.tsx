//frontend/app/dashboard/add-quotation/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api, type ApiLeadSearchResult } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Upload } from "lucide-react"
import { debounce } from "lodash"

export default function AddQuotationPage() {
  const [allLeads, setAllLeads] = useState<ApiLeadSearchResult[]>([])
  const [filteredLeads, setFilteredLeads] = useState<ApiLeadSearchResult[]>([])
  const [hasFetchedLeads, setHasFetchedLeads] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string>("")
  const [details, setDetails] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingLeads, setIsFetchingLeads] = useState(false)
  const { toast } = useToast()


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0])
    }
  }

  const handleLeadDropdownOpen = async (open: boolean) => {
    if (open && !hasFetchedLeads) {
      setIsFetchingLeads(true)
      try {
        const leadsData = await api.searchLeads("") // Fetch all lightweight leads
        setAllLeads(leadsData)
        setFilteredLeads(leadsData)
        setHasFetchedLeads(true)
      } catch (error) {
        toast({
          title: "Failed to fetch leads",
          description: "Could not load the list of leads. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsFetchingLeads(false)
      }
    }
  }

  const searchLeads = useCallback(
    debounce((searchTerm: string) => {
      if (!searchTerm) {
        setFilteredLeads(allLeads)
        return
      }
      const filtered = allLeads.filter((lead) =>
        lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredLeads(filtered)
    }, 200),
    [allLeads]
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedLeadId || !details.trim() || !file) {
      toast({
        title: "Missing Information",
        description: "Please select a lead, provide details, and choose a file to upload.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const activityDetails = `Quotation Added: ${details.trim()}`;
      
      await api.addActivityWithAttachment(Number(selectedLeadId), activityDetails, file);

      toast({
        title: "Success!",
        description: "Quotation has been successfully uploaded and logged as an activity.",
      })
      
      setSelectedLeadId("")
      setDetails("")
      setFile(null)
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Proposal</h1>
        <p className="text-muted-foreground">Upload a Proposal file and log it as an activity for a lead.</p>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Details</CardTitle>
          <CardDescription>Select a lead and the file you want to attach.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lead-select">Lead *</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId} onOpenChange={handleLeadDropdownOpen}>
                <SelectTrigger id="lead-select">
                  <SelectValue placeholder="Select or search for a lead..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search by company name..."
                      onChange={(e) => searchLeads(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <ScrollArea className="h-[200px]">
                    {isFetchingLeads ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : filteredLeads.length > 0 ? (
                      filteredLeads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id.toString()}>
                          {lead.company_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No leads found.
                      </div>
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Activity Details / Remarks *</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g., Sent initial quotation V1 as discussed on call."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-input">Proposal File *</Label>
              <Input id="file-input" type="file" onChange={handleFileChange} />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Quotation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}