import { useCallback, useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  PlayIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  ListViewIcon,
  Flowchart01Icon,
  LayoutTwoColumnIcon,
  Link01Icon,
  UploadSquare02Icon,
  Cancel01Icon,
  File01Icon,
  Image01Icon,
  TextStrikethroughIcon,
  ParagraphBulletsPoint02Icon,
  LeftToRightListNumberIcon,
} from "@hugeicons/core-free-icons"
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer"
import "bpmn-js/dist/assets/diagram-js.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { processes } from "@/components/processes/ProcessList"

type LayoutMode = "form" | "bpmn" | "split"

const CURRENT_PROCESS_ID = "con"

const COUNTERPARTIES = [
  { value: "acme", label: "Acme Corporation" },
  { value: "globex", label: "Globex International" },
  { value: "initech", label: "Initech Solutions" },
  { value: "umbrella", label: "Umbrella Ventures" },
  { value: "stark", label: "Stark Industries" },
  { value: "wayne", label: "Wayne Enterprises" },
  { value: "oscorp", label: "Oscorp Technologies" },
  { value: "soylent", label: "Soylent Corp" },
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function StartProcessPage() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("form")
  const [date, setDate] = useState<Date>()
  const [effectiveDate, setEffectiveDate] = useState<Date>()
  const [priority, setPriority] = useState("medium")
  const [files, setFiles] = useState<File[]>([])
  const [nativeRadio, setNativeRadio] = useState("option1")
  const [nativeCheckboxes, setNativeCheckboxes] = useState({ terms: false, marketing: true, newsletter: false })
  const [nativeSelect, setNativeSelect] = useState("")
  const [multiSelect, setMultiSelect] = useState<string[]>(["design"])
  const [rangeValue, setRangeValue] = useState(50)
  const [nativeColor, setNativeColor] = useState("#3b82f6")
  const [nativeNumber, setNativeNumber] = useState("")
  const [nativeUrl, setNativeUrl] = useState("")
  const [nativeEmail, setNativeEmail] = useState("")
  const [nativeTel, setNativeTel] = useState("")
  const [nativePassword, setNativePassword] = useState("")
  const viewerRef = useRef<HTMLDivElement>(null)
  const bpmnInstance = useRef<any>(null)

  const process = processes.find((p) => p.id === CURRENT_PROCESS_ID) ?? processes[0]

  // Tiptap rich text editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[140px] p-3 text-sm outline-none prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 leading-normal",
      },
    },
  })

  // react-dropzone
  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [],
      "image/*": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleStartProcess = () => {
    toast.success("Process Started", {
      description: `${process.name} has been successfully initiated.`,
    })
    setTimeout(() => {
      window.history.pushState({}, "", "/tasks")
      window.dispatchEvent(new PopStateEvent("popstate"))
    }, 1000)
  }

  useEffect(() => {
    if (layoutMode === "form") return
    if (bpmnInstance.current) {
      bpmnInstance.current.destroy()
      bpmnInstance.current = null
    }
    let isMounted = true
    const timer = setTimeout(async () => {
      if (!viewerRef.current || !isMounted) return
      try {
        const viewer = new NavigatedViewer({ container: viewerRef.current }) as any
        bpmnInstance.current = viewer
        const res = await fetch("/contract.bpmn")
        if (!res.ok) throw new Error("Failed to load BPMN file")
        const xml = await res.text()
        if (!isMounted) return
        await viewer.importXML(xml)
        viewer.get("canvas").zoom("fit-viewport")
      } catch (err: any) {
        console.error("Failed to load or parse BPMN", err)
      }
    }, 50)
    return () => { isMounted = false; clearTimeout(timer) }
  }, [layoutMode])

  useEffect(() => {
    return () => {
      if (bpmnInstance.current) {
        bpmnInstance.current.destroy()
        bpmnInstance.current = null
      }
    }
  }, [])

  const toggleItems: { value: LayoutMode; label: string; icon: any; hiddenOnMobile?: boolean }[] = [
    { value: "form", label: "Form", icon: ListViewIcon },
    { value: "bpmn", label: "BPMN Diagram", icon: Flowchart01Icon },
    { value: "split", label: "Split Layout", icon: LayoutTwoColumnIcon, hiddenOnMobile: true },
  ]

  return (
    <div className="p-6 md:p-10">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="flex items-center gap-2.5 text-xl font-normal font-heading min-w-0">
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white text-[10px] font-bold shadow-sm", process.gradient)}>
            {process.abbr}
          </span>
          <span className="truncate">Start {process.name}</span>
        </h1>
        <Button onClick={handleStartProcess} className="shrink-0 hidden sm:inline-flex">
          Start Process
          <HugeiconsIcon icon={PlayIcon} className="ml-1.5 size-4" />
        </Button>
      </div>

      {/* Main Card */}
      <Card className="p-0 overflow-hidden">
        <div className="flex min-h-[520px] md:min-h-[580px]">
          {/* Left: Vertical toggle rail */}
          <TooltipProvider>
            <div className="flex flex-col items-center gap-1 border-r border-border bg-muted/30 p-1.5 pt-8">
              {toggleItems.map(({ value, label, icon, hiddenOnMobile }) => (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setLayoutMode(value)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg transition-colors",
                        layoutMode === value
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                        hiddenOnMobile && "hidden md:flex"
                      )}
                    >
                      <HugeiconsIcon icon={icon} className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right"><span className="text-xs">{label}</span></TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          {/* Right: Content area */}
          <div className="flex flex-1 min-w-0 overflow-hidden">
            {/* Form Panel */}
            {(layoutMode === "form" || layoutMode === "split") && (
              <div className={cn(
                "flex-1 overflow-y-auto p-6 md:p-8",
                layoutMode === "split" && "max-w-xl border-r border-border"
              )}>
                <div className="space-y-8 max-w-2xl">

                  {/* ── Contract Details ── */}
                  <div className="space-y-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contract Details</p>

                    <div className="space-y-2">
                      <Label htmlFor="title">Contract Title</Label>
                      <Input id="title" placeholder="e.g., Q3 Vendor NDA" />
                    </div>

                    <div className="space-y-2">
                      <Label>Counterparty / Company</Label>
                      <Combobox>
                        <ComboboxInput placeholder="Search company..." showTrigger showClear className="w-full" />
                        <ComboboxContent>
                          <ComboboxList>
                            {COUNTERPARTIES.map((c) => (
                              <ComboboxItem key={c.value} value={c.value}>{c.label}</ComboboxItem>
                            ))}
                          </ComboboxList>
                          <ComboboxEmpty>No companies found</ComboboxEmpty>
                        </ComboboxContent>
                      </Combobox>
                    </div>

                    <div className="space-y-2">
                      <Label>Type of Contract</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                          <SelectItem value="employment">Employment Contract</SelectItem>
                          <SelectItem value="service">Service Agreement</SelectItem>
                          <SelectItem value="vendor">Vendor Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>

                  {/* ── Timeline ── */}
                  <div className="space-y-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Timeline</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Date of Agreement</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                              <HugeiconsIcon icon={Calendar01Icon} className="mr-2 size-4" />
                              {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Effective Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !effectiveDate && "text-muted-foreground")}>
                              <HugeiconsIcon icon={Calendar01Icon} className="mr-2 size-4" />
                              {effectiveDate ? format(effectiveDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={effectiveDate} onSelect={setEffectiveDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* ── Priority (shadcn RadioGroup) ── */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Priority</p>
                    <RadioGroup value={priority} onValueChange={setPriority} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[["low", "Low", "text-emerald-600"], ["medium", "Medium", "text-amber-600"], ["high", "High", "text-orange-600"], ["critical", "Critical", "text-red-600"]].map(([val, label, color]) => (
                        <label key={val} className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5", color)}>
                          <RadioGroupItem value={val} />{label}
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* ── Native HTML Inputs ── */}
                  <div className="space-y-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Native HTML Inputs</p>

                    {/* Native Radio Group */}
                    <fieldset className="space-y-2">
                      <Label asChild><legend>Contract Scope (native radio)</legend></Label>
                      <div className="flex flex-col gap-2">
                        {[["option1", "Domestic Only"], ["option2", "International"], ["option3", "Both Domestic & International"]].map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2.5 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name="contract-scope"
                              value={val}
                              checked={nativeRadio === val}
                              onChange={(e) => setNativeRadio(e.target.value)}
                              className="size-4 accent-[var(--primary)]"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    {/* Native Checkbox Group */}
                    <fieldset className="space-y-2">
                      <Label asChild><legend>Notifications (native checkbox group)</legend></Label>
                      <div className="flex flex-col gap-2">
                        {([
                          ["terms", "Accept terms & conditions"],
                          ["marketing", "Receive marketing updates"],
                          ["newsletter", "Subscribe to newsletter"],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2.5 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={nativeCheckboxes[key]}
                              onChange={(e) => setNativeCheckboxes((prev) => ({ ...prev, [key]: e.target.checked }))}
                              className="size-4 accent-[var(--primary)] rounded"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    {/* Native Select */}
                    <div className="space-y-2">
                      <Label htmlFor="native-select">Department (native select)</Label>
                      <select
                        id="native-select"
                        value={nativeSelect}
                        onChange={(e) => setNativeSelect(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="" disabled>Select department...</option>
                        <option value="legal">Legal</option>
                        <option value="finance">Finance</option>
                        <option value="hr">Human Resources</option>
                        <option value="engineering">Engineering</option>
                        <option value="marketing">Marketing</option>
                      </select>
                    </div>

                    {/* Native Multi-Select */}
                    <div className="space-y-2">
                      <Label htmlFor="native-multi">Required Skills (native multi-select)</Label>
                      <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
                      <select
                        id="native-multi"
                        multiple
                        value={multiSelect}
                        onChange={(e) => setMultiSelect(Array.from(e.target.selectedOptions, (o) => o.value))}
                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        size={5}
                      >
                        <option value="design">Design</option>
                        <option value="development">Development</option>
                        <option value="testing">Testing</option>
                        <option value="devops">DevOps</option>
                        <option value="management">Project Management</option>
                        <option value="analytics">Data Analytics</option>
                      </select>
                    </div>

                    {/* Native Range */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="native-range">Completion Progress (native range)</Label>
                        <span className="text-sm font-medium tabular-nums">{rangeValue}%</span>
                      </div>
                      <input
                        id="native-range"
                        type="range"
                        min={0}
                        max={100}
                        value={rangeValue}
                        onChange={(e) => setRangeValue(Number(e.target.value))}
                        className="w-full h-2 accent-[var(--primary)] cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span><span>100%</span>
                      </div>
                    </div>

                    {/* Native Color Picker */}
                    <div className="space-y-2">
                      <Label htmlFor="native-color">Brand Color (native color picker)</Label>
                      <div className="flex items-center gap-3">
                        <input
                          id="native-color"
                          type="color"
                          value={nativeColor}
                          onChange={(e) => setNativeColor(e.target.value)}
                          className="size-9 cursor-pointer rounded-lg border border-input p-0.5"
                        />
                        <span className="text-sm text-muted-foreground font-mono">{nativeColor}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Native Number */}
                      <div className="space-y-2">
                        <Label htmlFor="native-number">Quantity (native number)</Label>
                        <input
                          id="native-number"
                          type="number"
                          min={0}
                          max={999}
                          placeholder="0"
                          value={nativeNumber}
                          onChange={(e) => setNativeNumber(e.target.value)}
                          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      {/* Native URL */}
                      <div className="space-y-2">
                        <Label htmlFor="native-url">Website (native url)</Label>
                        <input
                          id="native-url"
                          type="url"
                          placeholder="https://example.com"
                          value={nativeUrl}
                          onChange={(e) => setNativeUrl(e.target.value)}
                          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      {/* Native Email */}
                      <div className="space-y-2">
                        <Label htmlFor="native-email">Contact Email (native email)</Label>
                        <input
                          id="native-email"
                          type="email"
                          placeholder="name@company.com"
                          value={nativeEmail}
                          onChange={(e) => setNativeEmail(e.target.value)}
                          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      {/* Native Tel */}
                      <div className="space-y-2">
                        <Label htmlFor="native-tel">Phone (native tel)</Label>
                        <input
                          id="native-tel"
                          type="tel"
                          placeholder="+62 812 3456 7890"
                          value={nativeTel}
                          onChange={(e) => setNativeTel(e.target.value)}
                          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      {/* Native Password */}
                      <div className="space-y-2">
                        <Label htmlFor="native-password">Secret Code (native password)</Label>
                        <input
                          id="native-password"
                          type="password"
                          placeholder="••••••••"
                          value={nativePassword}
                          onChange={(e) => setNativePassword(e.target.value)}
                          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Notes ── */}
                  <div className="space-y-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>

                    {/* Plain Textarea */}
                    <div className="space-y-2">
                      <Label htmlFor="internal-notes">Internal Notes</Label>
                      <Textarea
                        id="internal-notes"
                        placeholder="Add any internal notes or comments for the review team..."
                        className="min-h-[80px] resize-y"
                      />
                    </div>

                    {/* Rich Text Editor (Tiptap) */}
                    <div className="space-y-2">
                      <Label>Contract Abstract / Summary</Label>
                      <div className="border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-shadow bg-background">
                        {/* Toolbar */}
                        <div className="bg-muted/50 border-b border-border p-1.5 flex items-center gap-0.5 flex-wrap">
                          <Button
                            type="button" variant="ghost" size="icon-sm"
                            className={cn("size-7", editor?.isActive("bold") && "bg-muted text-foreground")}
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                          >
                            <HugeiconsIcon icon={TextBoldIcon} className="size-3.5" />
                          </Button>
                          <Button
                            type="button" variant="ghost" size="icon-sm"
                            className={cn("size-7", editor?.isActive("italic") && "bg-muted text-foreground")}
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                          >
                            <HugeiconsIcon icon={TextItalicIcon} className="size-3.5" />
                          </Button>
                          <Button
                            type="button" variant="ghost" size="icon-sm"
                            className={cn("size-7", editor?.isActive("underline") && "bg-muted text-foreground")}
                            onClick={() => editor?.chain().focus().toggleUnderline().run()}
                          >
                            <HugeiconsIcon icon={TextUnderlineIcon} className="size-3.5" />
                          </Button>
                          <Button
                            type="button" variant="ghost" size="icon-sm"
                            className={cn("size-7", editor?.isActive("strike") && "bg-muted text-foreground")}
                            onClick={() => editor?.chain().focus().toggleStrike().run()}
                          >
                            <HugeiconsIcon icon={TextStrikethroughIcon} className="size-3.5" />
                          </Button>
                          <div className="w-px h-4 bg-border mx-1" />
                          <Button
                            type="button" variant="ghost" size="icon-sm"
                            className={cn("size-7", editor?.isActive("bulletList") && "bg-muted text-foreground")}
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                          >
                            <HugeiconsIcon icon={ParagraphBulletsPoint02Icon} className="size-3.5" />
                          </Button>
                          <Button
                            type="button" variant="ghost" size="icon-sm"
                            className={cn("size-7", editor?.isActive("orderedList") && "bg-muted text-foreground")}
                            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                          >
                            <HugeiconsIcon icon={LeftToRightListNumberIcon} className="size-3.5" />
                          </Button>
                          <div className="w-px h-4 bg-border mx-1" />
                          <Button
                            type="button" variant="ghost" size="icon-sm"
                            className="size-7"
                            onClick={() => {
                              const url = window.prompt("Enter URL")
                              if (url) editor?.chain().focus().setLink({ href: url }).run()
                            }}
                          >
                            <HugeiconsIcon icon={Link01Icon} className="size-3.5" />
                          </Button>
                        </div>
                        <EditorContent editor={editor} />
                      </div>
                    </div>
                  </div>

                  {/* ── Attachments (react-dropzone) ── */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Attachments</p>

                    <div
                      {...getRootProps()}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer",
                        isDragActive
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-primary/50 hover:bg-muted/40"
                      )}
                    >
                      <input {...getInputProps()} />
                      <HugeiconsIcon icon={UploadSquare02Icon} className="size-8" />
                      <div>
                        <p className="text-sm font-medium">
                          {isDragActive ? "Drop files here" : "Drag & drop files here"}
                        </p>
                        <p className="text-xs mt-0.5">or <span className="text-primary font-medium">browse</span> — PDF, Word, Images up to 10MB</p>
                      </div>
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        {files.map((file, i) => {
                          const isImage = file.type.startsWith("image/")
                          return (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border text-muted-foreground">
                                <HugeiconsIcon icon={isImage ? Image01Icon : File01Icon} className="size-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Mobile button */}
                  <div className="pt-2 sm:hidden">
                    <Button className="w-full" size="lg" onClick={handleStartProcess}>
                      Start Process
                      <HugeiconsIcon icon={PlayIcon} className="ml-1.5 size-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* BPMN Panel */}
            {(layoutMode === "bpmn" || layoutMode === "split") && (
              <div className="flex-1 relative bg-white dark:bg-zinc-900 min-h-0">
                <div className="absolute inset-0" ref={viewerRef} />
                <div className="absolute top-3 left-3 pointer-events-none z-10">
                  <div className="bg-background/80 backdrop-blur-md border border-border px-2.5 py-1 rounded-lg shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">contract.bpmn</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
