"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/date-format";
import { api, type ApiActivity, type ApiLead } from "@/lib/api"
import { Loader2, Download, Paperclip, ArrowLeft } from "lucide-react"

export default function ViewQuotationsPage() {
  const router = useRouter()
  const params = useParams()
  const leadId = params.leadId as string

  const [lead, setLead] = useState<ApiLead | null>(null)
  const [quotations, setQuotations] = useState<ApiActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (leadId) {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          const [leadData, activitiesData] = await Promise.all([
            api.getLeadById(Number(leadId)),
            api.getActivities(Number(leadId)),
          ])
          setLead(leadData)
          // Filter activities to only show ones with attachments
          const quotationActivities = activitiesData.filter(activity => activity.attachment_path);
          setQuotations(quotationActivities)
        } catch (error) {
          console.error("Failed to fetch lead data or activities:", error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }
  }, [leadId])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading quotations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations for {lead?.company_name}</h1>
          <p className="text-muted-foreground">Review and download all quotations attached to this lead.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attached Files ({quotations.length})</CardTitle>
          <CardDescription>Each file was logged as a separate activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {quotations.length > 0 ? (
            <div className="space-y-4">
              {quotations.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      {q.details}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Uploaded on: {formatDate(q.created_at)}
                    </p>
                  </div>
                  <a href={`${API_URL}/attachments/${q.attachment_path}`} target="_blank" rel="noopener noreferrer">
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No quotations or attachments have been uploaded for this lead yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}