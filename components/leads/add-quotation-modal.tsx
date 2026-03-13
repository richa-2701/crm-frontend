// components/leads/add-quotation-modal.tsx
"use client"

import { useState, useRef } from "react"
import { Loader2, Paperclip, X, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface AddQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  leadId: number
  leadName: string
  createdBy: string
  onSuccess?: () => void
}

export function AddQuotationModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  createdBy,
  onSuccess,
}: AddQuotationModalProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" })
      return
    }
    if (!description.trim()) {
      toast({ title: "Description required", description: "Please enter a description for the quotation.", variant: "destructive" })
      return
    }

    setIsUploading(true)
    try {
      await api.addActivityWithAttachment(leadId, description.trim(), selectedFile, createdBy)
      toast({ title: "Quotation uploaded", description: `Quotation attached to ${leadName} successfully.` })
      setDescription("")
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      onSuccess?.()
      onClose()
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "An error occurred during upload.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (isUploading) return
    setDescription("")
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Quotation</DialogTitle>
          <DialogDescription>
            Attach a quotation document to <strong>{leadName}</strong>. It will be stored in S3 and visible on the View Quotations page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="quotation-description">Description <span className="text-destructive">*</span></Label>
            <Input
              id="quotation-description"
              placeholder="e.g. Q1 2026 Proposal v2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label>File <span className="text-destructive">*</span></Label>
            {!selectedFile ? (
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to select a file</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, images supported</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.ppt,.pptx"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading || !selectedFile || !description.trim()}>
            {isUploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
            ) : (
              <><Paperclip className="mr-2 h-4 w-4" />Upload Quotation</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
