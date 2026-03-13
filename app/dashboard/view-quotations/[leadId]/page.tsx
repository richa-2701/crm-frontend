// app/dashboard/view-quotations/[leadId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/date-format"
import { api, type ApiActivity, type ApiLead } from "@/lib/api"
import { Loader2, Download, Paperclip, ArrowLeft, Eye, EyeOff, FileText, Image as ImageIcon, File } from "lucide-react"

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"]
const PDF_EXTS = ["pdf"]

function getExt(url: string) {
  return (url.split(".").pop() || "").toLowerCase().split("?")[0]
}

function FilePreview({ url }: { url: string }) {
  const ext = getExt(url)
  if (IMAGE_EXTS.includes(ext)) {
    return (
      <div className="mt-3 rounded-md overflow-hidden border bg-muted/30 max-h-96">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Quotation preview" className="w-full object-contain max-h-96" />
      </div>
    )
  }
  if (PDF_EXTS.includes(ext)) {
    return (
      <div className="mt-3 rounded-md overflow-hidden border bg-muted/30 h-[500px]">
        <iframe
          src={`${url}#toolbar=0`}
          className="w-full h-full"
          title="PDF Preview"
        />
      </div>
    )
  }
  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
      <File className="h-4 w-4 shrink-0" />
      Preview not available for this file type. Use the Download button to open it.
    </div>
  )
}

function getFileIcon(url: string) {
  const ext = getExt(url)
  if (IMAGE_EXTS.includes(ext)) return ImageIcon
  if (PDF_EXTS.includes(ext)) return FileText
  return File
}

function getFileTypeBadge(url: string) {
  const ext = getExt(url)
  if (IMAGE_EXTS.includes(ext)) return { label: ext.toUpperCase(), className: "bg-blue-100 text-blue-700 border-blue-200" }
  if (PDF_EXTS.includes(ext))   return { label: "PDF",            className: "bg-red-100 text-red-700 border-red-200" }
  return { label: ext.toUpperCase() || "FILE", className: "bg-gray-100 text-gray-700 border-gray-200" }
}

function QuotationCard({ q, resolveUrl }: { q: ApiActivity; resolveUrl: (p: string) => string }) {
  const [showPreview, setShowPreview] = useState(false)
  const url = resolveUrl(q.attachment_path!)
  const FileIcon = getFileIcon(url)
  const badge = getFileTypeBadge(url)
  const ext = getExt(url)
  const canPreview = IMAGE_EXTS.includes(ext) || PDF_EXTS.includes(ext)

  return (
    <div className="rounded-lg border p-4 space-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <FileIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm truncate">{q.details}</p>
              <Badge variant="outline" className={`text-[11px] px-1.5 py-0 h-4 ${badge.className}`}>{badge.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Uploaded by <span className="font-medium">{q.created_by}</span> · {formatDateTime(q.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canPreview && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowPreview(v => !v)}
            >
              {showPreview
                ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" />Hide</>
                : <><Eye className="mr-1.5 h-3.5 w-3.5" />Preview</>}
            </Button>
          )}
          <a href={url} target="_blank" rel="noopener noreferrer" download>
            <Button size="sm" className="h-8 text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>
          </a>
        </div>
      </div>
      {showPreview && <FilePreview url={url} />}
    </div>
  )
}

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
            api.getActivitiesByLead(Number(leadId)),
          ])
          setLead(leadData)
          setQuotations(activitiesData.filter(a => a.activity_type === "Quotation" && a.attachment_path))
        } catch (error) {
          console.error("Failed to fetch quotation data:", error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }
  }, [leadId])

  // Resolve URL: S3 files are absolute (https://), legacy local paths need API_URL prefix
  const API_URL = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "").replace(/\/api$/, "")
  const resolveUrl = (path: string) => path.startsWith("https://") ? path : `${API_URL}${path}`

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
          <p className="text-muted-foreground">Review, preview and download all quotations attached to this lead.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attached Files
            <Badge variant="secondary" className="ml-1">{quotations.length}</Badge>
          </CardTitle>
          <CardDescription>
            PDFs and images can be previewed inline. Other file types can be downloaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotations.length > 0 ? (
            <div className="space-y-3">
              {quotations.map((q) => (
                <QuotationCard key={q.id} q={q} resolveUrl={resolveUrl} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Paperclip className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p>No quotations uploaded for this lead yet.</p>
              <p className="text-sm mt-1">Use "Add Quotation" from the Proposals page to attach one.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
