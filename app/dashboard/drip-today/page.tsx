"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Share2, CheckCircle2, Loader2, CalendarCheck, Clock, Send, Play, XCircle } from "lucide-react"

import { api, ApiManualDripCard, ApiDripHistoryItem, ApiUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"]

function getFileExt(url: string) {
  return (url.split(".").pop() || "").toLowerCase().split("?")[0]
}

// ─── TODAY CARD ────────────────────────────────────────────────
function DripCard({
  card,
  dismissing,
  sharing,
  starting,
  onShare,
  onMarkSent,
  onStart,
  onEnd,
}: {
  card: ApiManualDripCard
  dismissing: number | null
  sharing: number | null
  starting: boolean
  onShare: (c: ApiManualDripCard) => void
  onMarkSent: (c: ApiManualDripCard) => void
  onStart: (c: ApiManualDripCard) => void
  onEnd: (c: ApiManualDripCard) => void
}) {
  const isActionable = !card.actual_end_time;
  return (
    <Card className="flex flex-col shadow-sm border text-sm">
      <CardHeader className="p-2 pb-1 space-y-0.5">
        <p className="font-semibold leading-tight truncate text-xs" title={card.customer_name}>
          {card.customer_name}
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1 py-0 leading-tight h-4">{card.message_type}</Badge>
          <span className="text-[10px] text-muted-foreground">Day {card.day_to_send}</span>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-1 flex-1">
        <div className="bg-muted rounded p-1.5 text-[11px] leading-relaxed border-l-2 border-green-500 line-clamp-4 break-words">
          {card.message_content || <span className="italic text-muted-foreground">Media attachment</span>}
        </div>
        {card.attachment_path && (
          <p className="mt-1 text-[10px] text-muted-foreground truncate">📎 {card.attachment_path.split('/').pop()}</p>
        )}
        {card.actual_start_time && (
          <div className="flex items-center gap-1 mt-1 text-orange-600 text-[10px]">
            <Play className="h-2.5 w-2.5" />
            <span>Started: {new Date(card.actual_start_time).toLocaleTimeString()}</span>
          </div>
        )}
        {card.actual_end_time && (
          <div className="flex items-center gap-1 mt-1 text-green-600 text-[10px]">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>Ended: {new Date(card.actual_end_time).toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2 pt-0 gap-1 flex flex-col">
        <div className="flex gap-1 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-[11px] px-1 gap-1 border-blue-200 text-blue-600"
            disabled={sharing === card.step_id}
            onClick={() => onShare(card)}
          >
            {sharing === card.step_id
              ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
              : <Share2 className="h-3 w-3 shrink-0" />}
            <span className="hidden sm:inline">Share</span>
          </Button>

          {isActionable && (
            <>
              {!card.actual_start_time ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[11px] px-1 gap-1 border-green-500 text-green-600 hover:bg-green-50"
                  disabled={starting}
                  onClick={() => onStart(card)}
                >
                  {starting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  <span>Start</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[11px] px-1 gap-1 border-red-500 text-red-600 hover:bg-red-50"
                  disabled={starting}
                  onClick={() => onEnd(card)}
                >
                  {starting ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                  <span>End</span>
                </Button>
              )}
            </>
          )}
        </div>

        <Button
          size="sm"
          className="w-full h-7 text-[11px] px-1 gap-1 bg-green-600 hover:bg-green-700 text-white"
          disabled={dismissing === card.step_id}
          onClick={() => onMarkSent(card)}
        >
          {dismissing === card.step_id
            ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            : <CheckCircle2 className="h-3 w-3 shrink-0" />}
          <span>Mark as Sent</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ─── HISTORY ROW ───────────────────────────────────────────────
function HistoryRow({ item }: { item: ApiDripHistoryItem }) {
  const isSent = item.status === "sent"
  return (
    <div className="flex items-start gap-2 py-2 border-b last:border-0">
      <div className="mt-0.5 shrink-0">
        {isSent
          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate">{item.customer_name}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{item.message_type}</Badge>
          <span className="text-[10px] text-muted-foreground">Day {item.day_to_send}</span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{item.drip_name}</p>
        {item.message_content && (
          <p className="text-[11px] mt-0.5 line-clamp-2 text-foreground/80">{item.message_content}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <Badge
          variant={isSent ? "default" : "secondary"}
          className={`text-[10px] px-1.5 py-0 h-4 ${isSent ? "bg-green-100 text-green-700 border-green-200" : ""}`}
        >
          {isSent ? "Sent" : "Upcoming"}
        </Badge>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {isSent && item.sent_at
            ? new Date(item.sent_at).toLocaleDateString()
            : item.scheduled_date}
        </p>
      </div>
    </div>
  )
}

// ─── PAGE ──────────────────────────────────────────────────────
export default function DripTodayPage() {
  const router = useRouter()
  const [cards, setCards] = useState<ApiManualDripCard[]>([])
  const [history, setHistory] = useState<ApiDripHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [dismissing, setDismissing] = useState<number | null>(null)
  const [sharing, setSharing] = useState<number | null>(null)
  const [startingEvents, setStartingEvents] = useState<Set<string>>(new Set())
  const [username, setUsername] = useState<string>("")

  const fetchCards = useCallback(async (uname: string) => {
    setLoading(true)
    try {
      const data = await api.getManualDripToday(uname)
      setCards(data || [])
    } catch {
      toast.error("Failed to load today's drip messages.")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async (uname: string) => {
    setHistoryLoading(true)
    try {
      const data = await api.getDripHistory(uname)
      setHistory(data || [])
      setHistoryLoaded(true)
    } catch {
      toast.error("Failed to load history.")
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    const userRaw = localStorage.getItem("user")
    if (!userRaw) { router.push("/login"); return }
    try {
      const user: ApiUser = JSON.parse(userRaw)
      setUsername(user.username)
      fetchCards(user.username)
    } catch {
      router.push("/login")
    }
  }, [fetchCards, router])

  const handleTabChange = (tab: string) => {
    if (tab === "history" && !historyLoaded && username) {
      fetchHistory(username)
    }
  }

  const handleShare = async (card: ApiManualDripCard) => {
    const text = card.message_content || ""
    const attachmentUrl = card.attachment_path
    const hasTextAndMedia = !!text && !!attachmentUrl

    setSharing(card.step_id)
    try {
      if (navigator.share) {
        if (attachmentUrl) {
          try {
            const res = await fetch(attachmentUrl)
            const blob = await res.blob()
            const fileName = attachmentUrl.split("/").pop() || "attachment"
            const file = new File([blob], fileName, { type: blob.type })

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], text })
              return
            }
          } catch {
          }
        }
        await navigator.share({ text }).catch(() => { })
        return
      }

      if (attachmentUrl) {
        const ext = getFileExt(attachmentUrl)
        const isImage = IMAGE_EXTS.includes(ext)

        if (isImage) {
          try {
            const res = await fetch(attachmentUrl)
            const blob = await res.blob()
            const pngBlob = blob.type === "image/png" ? blob : await convertToPng(blob)
            await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })])

            if (hasTextAndMedia) {
              toast.info("Image copied! In WhatsApp press Ctrl+V → image preview opens → paste caption in caption field.", {
                duration: 20000,
                action: { label: "Copy Caption", onClick: () => navigator.clipboard.writeText(text) },
              })
            } else {
              toast.info("Image copied! Open WhatsApp, click the chat and press Ctrl+V to paste.", { duration: 6000 })
            }
          } catch {
            toast.info("Could not copy image automatically. Please download it manually.", { duration: 5000 })
          }
          window.open("https://web.whatsapp.com", "_blank")
        } else {
          const a = document.createElement("a")
          a.href = attachmentUrl
          a.download = attachmentUrl.split("/").pop() || "document"
          a.target = "_blank"
          a.click()

          if (hasTextAndMedia) {
            toast.info("Document downloaded! In WhatsApp click 📎 Attach → select the file → add caption in caption field.", {
              duration: 20000,
              action: { label: "Copy Caption", onClick: () => navigator.clipboard.writeText(text) },
            })
          } else {
            toast.info("Document downloaded — please attach it from your device in WhatsApp.", { duration: 6000 })
          }
          window.open("https://web.whatsapp.com", "_blank")
        }
        return
      }

      window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank")
    } finally {
      setSharing(null)
    }
  }

  async function convertToPng(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext("2d")!.drawImage(img, 0, 0)
        canvas.toBlob(b => b ? resolve(b) : reject(), "image/png")
      }
      img.onerror = reject
      img.src = URL.createObjectURL(blob)
    })
  }

  const handleMarkSent = async (card: ApiManualDripCard) => {
    setDismissing(card.step_id)
    try {
      await api.markManualDripSent(card.assignment_id, card.step_id, username)
      setCards(prev => prev.filter(c => !(c.assignment_id === card.assignment_id && c.step_id === card.step_id)))
      toast.success(`Marked sent for ${card.customer_name}`)
      setHistoryLoaded(false)
    } catch {
      toast.error("Failed to mark as sent. Please try again.")
    } finally {
      setDismissing(null)
    }
  }

  const captureGPS = () => new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error("Could not get location. Please allow location access.")),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })

  const handleStartTask = async (card: ApiManualDripCard) => {
    const eventKey = `${card.assignment_id}-${card.step_id}`
    setStartingEvents(prev => new Set([...prev, eventKey]))
    try {
      const coords = await captureGPS()
      const payload = { Latitude: coords.latitude, Longitude: coords.longitude }
      
      // Using meeting location API as proxy for drip location if no specific API exists
      const response = await api.saveMeetingLocation(card.assignment_id, payload)
      const address = response?.location_text || ""
      
      toast.success(`Task started at ${address || "captured location"}`)
      fetchCards(username)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setStartingEvents(prev => {
        const next = new Set(prev)
        next.delete(eventKey)
        return next
      })
    }
  }

  const handleEndTask = async (card: ApiManualDripCard) => {
    const eventKey = `${card.assignment_id}-${card.step_id}`
    setStartingEvents(prev => new Set([...prev, eventKey]))
    try {
      const coords = await captureGPS()
      const payload = { Latitude: coords.latitude, Longitude: coords.longitude }
      
      const response = await api.endMeeting(card.assignment_id, payload)
      const address = response?.location_text || ""
      
      toast.success(`Task ended at ${address || "captured location"}`)
      fetchCards(username)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setStartingEvents(prev => {
        const next = new Set(prev)
        next.delete(eventKey)
        return next
      })
    }
  }

  // ── FILTER CARDS ──
  const now = new Date()
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
  const todayCards = cards.filter(c => c.scheduled_date === todayStr)
  const overdueCards = cards.filter(c => c.scheduled_date < todayStr)

  const sentItems = history.filter(h => h.status === "sent")
  const upcomingItems = history.filter(h => h.status === "pending")

  return (
    <Tabs defaultValue="today" onValueChange={handleTabChange} className="space-y-3">
      <div className="flex items-center justify-between">
        <TabsList className="h-8">
          <TabsTrigger value="today" className="text-xs h-7 px-3">
            Today
            {todayCards.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">{todayCards.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs h-7 px-3">
            Overdue
            {overdueCards.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">{overdueCards.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs h-7 px-3">
            <Send className="h-3 w-3 mr-1" />
            Sent &amp; Upcoming
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ── TODAY TAB ── */}
      <TabsContent value="today" className="mt-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading today's messages...</p>
          </div>
        ) : todayCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <div className="rounded-full bg-green-100 p-4">
              <CalendarCheck className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Today's list is clear!</h2>
              {overdueCards.length > 0 ? (
                <p className="text-sm text-muted-foreground mt-1">But you have <span className="text-destructive font-bold">{overdueCards.length} overdue</span> messages to catch up on.</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No pending drip messages for today.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {todayCards.map(card => (
              <DripCard
                key={`${card.assignment_id}-${card.step_id}`}
                card={card}
                dismissing={dismissing}
                sharing={sharing}
                starting={startingEvents.has(`${card.assignment_id}-${card.step_id}`)}
                onShare={handleShare}
                onMarkSent={handleMarkSent}
                onStart={handleStartTask}
                onEnd={handleEndTask}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── OVERDUE TAB ── */}
      <TabsContent value="overdue" className="mt-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Checking overdue...</p>
          </div>
        ) : overdueCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <div className="rounded-full bg-blue-100 p-4">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">No Overdue Messages</h2>
              <p className="text-sm text-muted-foreground mt-1">Great job! You are current with all your drips.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {overdueCards.map(card => (
              <div key={`${card.assignment_id}-${card.step_id}`} className="relative">
                <Badge className="absolute -top-1 -right-1 z-10 text-[9px] px-1 h-3.5 bg-destructive border-none">
                  MISS_DAY {Math.floor((new Date(todayStr).getTime() - new Date(card.scheduled_date).getTime()) / (1000 * 3600 * 24))}
                </Badge>
                <DripCard
                  card={card}
                  dismissing={dismissing}
                  sharing={sharing}
                  starting={startingEvents.has(`${card.assignment_id}-${card.step_id}`)}
                  onShare={handleShare}
                  onMarkSent={handleMarkSent}
                  onStart={handleStartTask}
                  onEnd={handleEndTask}
                />
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── HISTORY TAB ── */}
      <TabsContent value="history" className="mt-0">
        {historyLoading ? (
          <div className="flex items-center justify-center min-h-[40vh] gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading history...</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-3 h-[calc(100vh-12rem)]">
            <div className="flex flex-col flex-1 min-h-0 border rounded-md overflow-hidden">
              <div className="px-3 py-2 border-b bg-muted/40 shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Upcoming <span className="ml-1 text-foreground">({upcomingItems.length})</span>
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 divide-y">
                {upcomingItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No upcoming messages.</p>
                ) : (
                  upcomingItems.map(item => (
                    <HistoryRow key={`${item.assignment_id}-${item.step_id}`} item={item} />
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 border rounded-md overflow-hidden">
              <div className="px-3 py-2 border-b bg-muted/40 shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Sent <span className="ml-1 text-foreground">({sentItems.length})</span>
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 divide-y">
                {sentItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No sent messages yet.</p>
                ) : (
                  sentItems.map(item => (
                    <HistoryRow key={`${item.assignment_id}-${item.step_id}-sent`} item={item} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
