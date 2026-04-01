import * as React from "react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { useTheme } from "@/components/theme-provider"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { DirectionProvider } from "@/components/ui/direction"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Toaster } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  RiArrowRightSLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiCommandLine,
  RiInformationLine,
  RiLineChartLine,
  RiMoreLine,
  RiRefreshLine,
  RiSearchLine,
} from "@remixicon/react"

const installedComponents = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "button-group",
  "calendar",
  "card",
  "carousel",
  "chart",
  "checkbox",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "dialog",
  "direction",
  "drawer",
  "dropdown-menu",
  "empty",
  "field",
  "hover-card",
  "input",
  "input-group",
  "input-otp",
  "item",
  "kbd",
  "label",
  "menubar",
  "native-select",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "radio-group",
  "resizable",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "sonner",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toggle",
  "toggle-group",
  "tooltip",
] as const

const sectionLinks = [
  { id: "overview", label: "Overview" },
  { id: "inputs", label: "Inputs" },
  { id: "data", label: "Data" },
  { id: "overlays", label: "Overlays" },
  { id: "inventory", label: "Inventory" },
] as const

const chartData = [
  { month: "Jan", web: 186, app: 96 },
  { month: "Feb", web: 305, app: 144 },
  { month: "Mar", web: 237, app: 132 },
  { month: "Apr", web: 173, app: 118 },
  { month: "May", web: 209, app: 152 },
  { month: "Jun", web: 264, app: 164 },
]

const chartConfig = {
  web: {
    label: "Web",
    color: "var(--chart-1)",
  },
  app: {
    label: "App",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const frameworks = ["React", "Vue", "Svelte", "Nuxt", "Astro", "Remix"] as const

const tableRows = [
  { team: "Northwind", status: "Ready", velocity: "42 pts", owner: "Ari" },
  { team: "June", status: "Review", velocity: "31 pts", owner: "Mika" },
  { team: "Gamma", status: "Blocked", velocity: "18 pts", owner: "Devi" },
  { team: "Orbit", status: "Shipping", velocity: "47 pts", owner: "Rian" },
]

const notes = [
  "Everything on this page is backed by source components in `src/components/ui`.",
  "The sidebar, dialogs, sheet, drawer, menus, tooltip, and toast are fully interactive.",
  "The inventory panel lists every installed shadcn component in this repo.",
  "Press `d` to toggle the local theme provider, or use the theme buttons in the hero card.",
  "Use the command palette button or press the menu button in the header to explore actions.",
]

function App() {
  const { theme, setTheme } = useTheme()
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date()
  )
  const [otp, setOtp] = React.useState("281903")
  const [emailUpdates, setEmailUpdates] = React.useState(true)
  const [releaseAlerts, setReleaseAlerts] = React.useState(false)

  return (
    <DirectionProvider dir="ltr">
      <SidebarProvider defaultOpen>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Avatar size="lg">
                <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80" />
                <AvatarFallback>UI</AvatarFallback>
                <AvatarBadge />
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-heading text-sm font-medium">Kitchen Sink</div>
                <div className="text-xs text-muted-foreground">
                  {installedComponents.length} installed primitives
                </div>
              </div>
              <Badge variant="secondary">v4</Badge>
            </div>
            <SidebarInput placeholder="Search the kit" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Sections</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sectionLinks.map((section) => (
                    <SidebarMenuItem key={section.id}>
                      <SidebarMenuButton asChild tooltip={section.label}>
                        <a href={`#${section.id}`}>
                          <span>{section.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Foundations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Theme">
                      <span>Theme</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{theme}</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Source">
                      <span>Source files</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{installedComponents.length}</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Shortcuts">
                      <span>Shortcuts</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="#overview">Buttons, badges, tabs</a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="#inputs">Fields and structured input</a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="#overlays">Dialogs, menus, commands</a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <Item variant="muted" size="sm">
              <ItemContent>
                <ItemTitle>Preview Workspace</ItemTitle>
                <ItemDescription>
                  Built to inspect the full shadcn surface quickly.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toast("Shortcut reference opened")}
                >
                  <RiCommandLine />
                </Button>
              </ItemActions>
            </Item>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <div className="flex min-h-svh flex-col">
            <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="h-5" />
                  <div className="min-w-0">
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink href="#overview">App V2</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>Shadcn Kitchen Sink</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Menubar>
                    <MenubarMenu>
                      <MenubarTrigger>File</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem onSelect={() => toast("New draft created")}>
                          New Draft
                          <MenubarShortcut>Cmd+N</MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem onSelect={() => toast("Preview exported")}>
                          Export Preview
                          <MenubarShortcut>Cmd+E</MenubarShortcut>
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem variant="destructive">Reset Canvas</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger>View</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem onSelect={() => setCommandOpen(true)}>
                          Open Command Palette
                          <MenubarShortcut>Cmd+K</MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem onSelect={() => toast("Component inventory focused")}>
                          Jump to Inventory
                        </MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        More
                        <RiMoreLine data-icon="inline-end" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => toast("Theme synced")}>
                          Sync tokens
                          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast("Preview refreshed")}>
                          Refresh preview
                          <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setCommandOpen(true)}>
                        Open command menu
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="default" size="sm" onClick={() => setCommandOpen(true)}>
                    <RiCommandLine data-icon="inline-start" />
                    Command
                  </Button>
                </div>
              </div>
            </header>

            <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
                <section id="overview" className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <Badge variant="outline">Kitchen sink</Badge>
                          <CardTitle className="font-heading text-3xl">
                            A live index of the installed shadcn UI kit
                          </CardTitle>
                          <CardDescription className="max-w-2xl">
                            This page mixes production-style composition with small
                            interaction demos so you can inspect the component set
                            in one place.
                          </CardDescription>
                        </div>
                        <ButtonGroup>
                          <Button
                            variant={theme === "light" ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setTheme("light")}
                          >
                            Light
                          </Button>
                          <ButtonGroupSeparator />
                          <Button
                            variant={theme === "dark" ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setTheme("dark")}
                          >
                            Dark
                          </Button>
                          <ButtonGroupSeparator />
                          <Button
                            variant={theme === "system" ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setTheme("system")}
                          >
                            System
                          </Button>
                        </ButtonGroup>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button>
                          Primary
                          <RiArrowRightSLine data-icon="inline-end" />
                        </Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="link">Inline link</Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="outline">Outline</Badge>
                        <Badge variant="destructive">Blocked</Badge>
                        <Toggle defaultPressed aria-label="Toggle density">
                          Dense
                        </Toggle>
                        <ToggleGroup type="multiple" variant="outline" spacing={1}>
                          <ToggleGroupItem value="guides">Guides</ToggleGroupItem>
                          <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
                          <ToggleGroupItem value="metrics">Metrics</ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      <Alert>
                        <RiInformationLine />
                        <AlertTitle>Preview mode is interactive</AlertTitle>
                        <AlertDescription>
                          Open menus, resize panels, flip themes, and trigger toasts
                          without leaving the page.
                        </AlertDescription>
                        <AlertAction>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => toast("Toast wired through Sonner")}
                          >
                            Test toast
                          </Button>
                        </AlertAction>
                      </Alert>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-dashed">
                          <CardHeader>
                            <CardTitle>Identity</CardTitle>
                            <CardDescription>
                              Avatar, tooltip, hover card, and grouped presence.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar size="lg">
                                    <AvatarImage src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80" />
                                    <AvatarFallback>AL</AvatarFallback>
                                    <AvatarBadge />
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span>Lead designer</span>
                                </TooltipContent>
                              </Tooltip>

                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Team card
                                  </Button>
                                </HoverCardTrigger>
                                <HoverCardContent>
                                  <div className="flex items-start gap-3">
                                    <Avatar>
                                      <AvatarFallback>MK</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">Mika K.</div>
                                      <div className="text-muted-foreground">
                                        Shipping shared UI patterns this sprint.
                                      </div>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </div>

                            <AvatarGroup>
                              <Avatar size="sm">
                                <AvatarFallback>AN</AvatarFallback>
                              </Avatar>
                              <Avatar size="sm">
                                <AvatarFallback>DV</AvatarFallback>
                              </Avatar>
                              <Avatar size="sm">
                                <AvatarFallback>RA</AvatarFallback>
                              </Avatar>
                              <AvatarGroupCount>+4</AvatarGroupCount>
                            </AvatarGroup>
                          </CardContent>
                        </Card>

                        <Card className="border-dashed">
                          <CardHeader>
                            <CardTitle>Shortcuts</CardTitle>
                            <CardDescription>
                              KBD tokens, grouped buttons, and quick command entry.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-4">
                            <ButtonGroup>
                              <Button variant="outline" size="sm" onClick={() => setCommandOpen(true)}>
                                <RiSearchLine data-icon="inline-start" />
                                Search
                              </Button>
                              <ButtonGroupSeparator />
                              <ButtonGroupText>
                                <KbdGroup>
                                  <Kbd>Cmd</Kbd>
                                  <Kbd>K</Kbd>
                                </KbdGroup>
                              </ButtonGroupText>
                            </ButtonGroup>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Kbd>d</Kbd>
                              toggles theme in the local theme provider.
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Token notes
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <PopoverHeader>
                                  <PopoverTitle>Design tokens</PopoverTitle>
                                  <PopoverDescription>
                                    This preset uses CSS variables in `src/index.css`
                                    and source components in `src/components/ui`.
                                  </PopoverDescription>
                                </PopoverHeader>
                              </PopoverContent>
                            </Popover>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RiCheckboxCircleLine />
                        Interactive preview ready
                      </div>
                      <Button variant="outline" onClick={() => toast("Refresh simulated")}>
                        <RiRefreshLine data-icon="inline-start" />
                        Refresh preview
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tabbed Snapshot</CardTitle>
                      <CardDescription>
                        Tabs, empty state, and status blocks in a compact panel.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="summary" className="flex flex-col gap-4">
                        <TabsList>
                          <TabsTrigger value="summary">Summary</TabsTrigger>
                          <TabsTrigger value="activity">Activity</TabsTrigger>
                          <TabsTrigger value="empty">Empty</TabsTrigger>
                        </TabsList>
                        <TabsContent value="summary" className="flex flex-col gap-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <MetricCard label="Components" value={installedComponents.length.toString()} />
                            <MetricCard label="Preview sections" value={sectionLinks.length.toString()} />
                            <MetricCard label="Theme" value={theme} />
                            <MetricCard label="Surface" value="Interactive" />
                          </div>
                        </TabsContent>
                        <TabsContent value="activity" className="flex flex-col gap-3">
                          <ItemGroup>
                            {tableRows.slice(0, 3).map((row) => (
                              <Item key={row.team} variant="outline">
                                <ItemContent>
                                  <ItemTitle>{row.team}</ItemTitle>
                                  <ItemDescription>
                                    {row.owner} is holding {row.velocity} with status {row.status}.
                                  </ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                  <Badge variant={row.status === "Blocked" ? "destructive" : "secondary"}>
                                    {row.status}
                                  </Badge>
                                </ItemActions>
                              </Item>
                            ))}
                          </ItemGroup>
                        </TabsContent>
                        <TabsContent value="empty">
                          <Empty className="border">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <RiLineChartLine />
                              </EmptyMedia>
                              <EmptyTitle>No anomalies detected</EmptyTitle>
                              <EmptyDescription>
                                This empty state uses the generated component rather than custom markup.
                              </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                              <Button variant="outline" size="sm">
                                Generate sample data
                              </Button>
                            </EmptyContent>
                          </Empty>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </section>

                <section id="inputs" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Forms and Structured Input</CardTitle>
                      <CardDescription>
                        Field layouts, validation scaffolding, select controls, and composed inputs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="project-name">Project name</FieldLabel>
                          <Input id="project-name" placeholder="Marketing control room" />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="project-url">Workspace URL</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon align="inline-start">
                              <InputGroupText>https://</InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              id="project-url"
                              placeholder="app.example.com"
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupButton size="icon-xs">
                                <RiArrowRightSLine />
                              </InputGroupButton>
                            </InputGroupAddon>
                          </InputGroup>
                          <FieldDescription>
                            Input groups are useful for composed controls and inline actions.
                          </FieldDescription>
                        </Field>

                        <FieldSeparator>Controls</FieldSeparator>

                        <Field>
                          <FieldLabel htmlFor="framework">Framework</FieldLabel>
                          <Select defaultValue="react">
                            <SelectTrigger id="framework" className="w-full">
                              <SelectValue placeholder="Choose a framework" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {frameworks.map((framework) => (
                                  <SelectItem key={framework} value={framework.toLowerCase()}>
                                    {framework}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="native">Native select</FieldLabel>
                          <NativeSelect id="native" className="w-full" defaultValue="balanced">
                            <NativeSelectOption value="balanced">Balanced density</NativeSelectOption>
                            <NativeSelectOption value="compact">Compact density</NativeSelectOption>
                            <NativeSelectOption value="airy">Airy spacing</NativeSelectOption>
                          </NativeSelect>
                        </Field>

                        <Field data-invalid="true">
                          <FieldLabel htmlFor="notes">Release notes</FieldLabel>
                          <Textarea
                            id="notes"
                            aria-invalid
                            placeholder="Summarize what changed in this build..."
                          />
                          <FieldDescription>
                            Use multiline input for supporting context and operator notes.
                          </FieldDescription>
                          <FieldError errors={[{ message: "Add a short release summary." }]} />
                        </Field>
                      </FieldGroup>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Selection Patterns</CardTitle>
                        <CardDescription>
                          Checkbox, switch, slider, radios, combobox, and OTP.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-5">
                        <FieldSet>
                          <FieldLegend>Preferences</FieldLegend>
                          <Field orientation="horizontal">
                            <Checkbox
                              id="email-updates"
                              checked={emailUpdates}
                              onCheckedChange={(checked) => setEmailUpdates(checked === true)}
                            />
                            <FieldContent>
                              <FieldLabel htmlFor="email-updates">Email updates</FieldLabel>
                              <FieldDescription>
                                Receive weekly component and release notifications.
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                          <Field orientation="horizontal">
                            <Switch
                              id="release-alerts"
                              checked={releaseAlerts}
                              onCheckedChange={setReleaseAlerts}
                            />
                            <FieldContent>
                              <FieldLabel htmlFor="release-alerts">Release alerts</FieldLabel>
                              <FieldDescription>
                                Push urgent status changes to the preview canvas.
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldSet>

                        <FieldSet>
                          <FieldLegend>Density</FieldLegend>
                          <RadioGroup defaultValue="balanced">
                            <Field orientation="horizontal">
                              <RadioGroupItem value="compact" id="density-compact" />
                              <FieldLabel htmlFor="density-compact">Compact</FieldLabel>
                            </Field>
                            <Field orientation="horizontal">
                              <RadioGroupItem value="balanced" id="density-balanced" />
                              <FieldLabel htmlFor="density-balanced">Balanced</FieldLabel>
                            </Field>
                            <Field orientation="horizontal">
                              <RadioGroupItem value="airy" id="density-airy" />
                              <FieldLabel htmlFor="density-airy">Airy</FieldLabel>
                            </Field>
                          </RadioGroup>
                        </FieldSet>

                        <Field>
                          <FieldLabel>Confidence threshold</FieldLabel>
                          <Slider defaultValue={[72]} max={100} step={1} />
                        </Field>

                        <Field>
                          <FieldLabel>Framework combobox</FieldLabel>
                          <Combobox items={frameworks} defaultValue="React">
                            <ComboboxInput placeholder="Choose framework" />
                            <ComboboxContent>
                              <ComboboxEmpty>No framework found.</ComboboxEmpty>
                              <ComboboxList>
                                {(item) => (
                                  <ComboboxItem key={item} value={item}>
                                    {item}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="otp-demo">Verification code</FieldLabel>
                          <InputOTP
                            id="otp-demo"
                            maxLength={6}
                            pattern={REGEXP_ONLY_DIGITS}
                            value={otp}
                            onChange={setOtp}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </Field>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Calendar</CardTitle>
                        <CardDescription>
                          Date picking with generated navigation and range styles.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="rounded-none border"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <section id="data" className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Charts and Tables</CardTitle>
                      <CardDescription>
                        Source chart helpers, table primitives, badges, and item rows.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                      <Card className="border-dashed">
                        <CardHeader>
                          <CardTitle>Traffic mix</CardTitle>
                          <CardDescription>Bar chart using the generated chart container.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer config={chartConfig} className="min-h-[260px] w-full">
                            <BarChart accessibilityLayer data={chartData}>
                              <CartesianGrid vertical={false} />
                              <XAxis dataKey="month" tickLine={false} axisLine={false} />
                              <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dashed" />}
                              />
                              <Bar dataKey="web" fill="var(--color-web)" radius={0} />
                              <Bar dataKey="app" fill="var(--color-app)" radius={0} />
                            </BarChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>

                      <Card className="border-dashed">
                        <CardHeader>
                          <CardTitle>Delivery board</CardTitle>
                          <CardDescription>
                            Table, badge variants, and inline row content.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Team</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Velocity</TableHead>
                                <TableHead>Owner</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableRows.map((row) => (
                                <TableRow key={row.team}>
                                  <TableCell>{row.team}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        row.status === "Blocked"
                                          ? "destructive"
                                          : row.status === "Review"
                                            ? "outline"
                                            : "secondary"
                                      }
                                    >
                                      {row.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{row.velocity}</TableCell>
                                  <TableCell>{row.owner}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card>
                      <CardHeader>
                        <CardTitle>Layout and Motion</CardTitle>
                        <CardDescription>
                          Aspect ratio, carousel, resizable panels, and scroll area.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-6">
                        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-none border">
                          <div className="flex size-full items-end bg-[linear-gradient(135deg,var(--color-chart-1),var(--color-chart-2),var(--color-chart-4))] p-4 text-background">
                            <div>
                              <div className="font-heading text-xl">Layout primitives</div>
                              <div className="text-xs/relaxed text-background/80">
                                Aspect ratio is useful for media placeholders and editorial blocks.
                              </div>
                            </div>
                          </div>
                        </AspectRatio>

                        <div className="mx-auto w-full max-w-md px-10">
                          <Carousel opts={{ align: "start" }}>
                            <CarouselContent>
                              {["Launch notes", "Operator board", "Component lab"].map((label) => (
                                <CarouselItem key={label}>
                                  <Card className="border-dashed">
                                    <CardContent className="flex min-h-32 flex-col justify-between gap-3 p-4">
                                      <Badge variant="outline">Slide</Badge>
                                      <div>
                                        <div className="font-heading text-lg">{label}</div>
                                        <div className="text-muted-foreground">
                                          Carousel ships with keyboard and button controls.
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                          </Carousel>
                        </div>

                        <ResizablePanelGroup
                          orientation="horizontal"
                          className="min-h-[220px] overflow-hidden rounded-none border"
                        >
                          <ResizablePanel defaultSize={55} className="p-4">
                            <ItemGroup>
                              <Item variant="outline">
                                <ItemHeader>
                                  <ItemTitle>Primary panel</ItemTitle>
                                </ItemHeader>
                                <ItemContent>
                                  <ItemDescription>
                                    Resize the handle to see the generated panel primitives in action.
                                  </ItemDescription>
                                </ItemContent>
                              </Item>
                              <ItemSeparator />
                              <Progress value={68} />
                            </ItemGroup>
                          </ResizablePanel>
                          <ResizableHandle withHandle />
                          <ResizablePanel defaultSize={45} className="p-4">
                            <ScrollArea className="h-full pr-4">
                              <div className="flex flex-col gap-3">
                                {notes.map((note) => (
                                  <Item key={note} variant="muted" size="xs">
                                    <ItemMedia variant="icon">
                                      <RiInformationLine />
                                    </ItemMedia>
                                    <ItemContent>
                                      <ItemDescription>{note}</ItemDescription>
                                    </ItemContent>
                                  </Item>
                                ))}
                              </div>
                            </ScrollArea>
                          </ResizablePanel>
                        </ResizablePanelGroup>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Lists, Loading, and Disclosure</CardTitle>
                        <CardDescription>
                          Item composition, accordion, collapsible content, pagination, skeleton, and spinner.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-6">
                        <ItemGroup>
                          {tableRows.map((row) => (
                            <Item key={row.team} variant="outline">
                              <ItemMedia variant="icon">
                                <RiLineChartLine />
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>{row.team}</ItemTitle>
                                <ItemDescription>
                                  Owner {row.owner} is tracking {row.velocity} this cycle.
                                </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <Badge variant="outline">{row.status}</Badge>
                              </ItemActions>
                              <ItemFooter>
                                <Button variant="ghost" size="xs">
                                  Open
                                </Button>
                              </ItemFooter>
                            </Item>
                          ))}
                        </ItemGroup>

                        <Accordion type="single" collapsible className="w-full border">
                          <AccordionItem value="accessibility">
                            <AccordionTrigger>Why use source components?</AccordionTrigger>
                            <AccordionContent>
                              Because each component is added to your project as editable source, the preview is easy to customize and audit.
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="tokens">
                            <AccordionTrigger>Where do the tokens live?</AccordionTrigger>
                            <AccordionContent>
                              Global color, radius, and typography tokens are defined in `src/index.css`.
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <Collapsible defaultOpen>
                          <div className="flex items-center justify-between rounded-none border p-3">
                            <div>
                              <div className="font-medium">Loading states</div>
                              <div className="text-muted-foreground">
                                Skeleton and spinner primitives for placeholder UI.
                              </div>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm">
                                Toggle
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent className="pt-3">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="flex flex-col gap-3 rounded-none border p-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-4 w-40" />
                              </div>
                              <div className="flex items-center justify-center rounded-none border p-6">
                                <Spinner />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious href="#data" />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink href="#overview">1</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink href="#inputs" isActive>
                                2
                              </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext href="#overlays" />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <section id="overlays" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dialogs, Sheets, Drawers, Commands</CardTitle>
                      <CardDescription>
                        Modal surfaces, inline overlays, and command search.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Open dialog</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Dialog preview</DialogTitle>
                            <DialogDescription>
                              This modal is wired from the generated dialog component.
                            </DialogDescription>
                          </DialogHeader>
                          <FieldGroup>
                            <Field>
                              <FieldLabel htmlFor="dialog-name">Name</FieldLabel>
                              <Input id="dialog-name" defaultValue="Kitchen sink" />
                            </Field>
                          </FieldGroup>
                          <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button onClick={() => toast("Dialog action fired")}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline">Open sheet</Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                          <SheetHeader>
                            <SheetTitle>Inspector panel</SheetTitle>
                            <SheetDescription>
                              Use sheets for persistent side-panel workflows.
                            </SheetDescription>
                          </SheetHeader>
                          <div className="flex flex-col gap-3 p-4">
                            <Item variant="outline" size="xs">
                              <ItemContent>
                                <ItemTitle>Selected block</ItemTitle>
                                <ItemDescription>Hero headline and supporting copy.</ItemDescription>
                              </ItemContent>
                            </Item>
                            <Progress value={82} />
                          </div>
                          <SheetFooter>
                            <Button variant="outline">Close</Button>
                          </SheetFooter>
                        </SheetContent>
                      </Sheet>

                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button variant="outline">Open drawer</Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHeader>
                            <DrawerTitle>Mobile action drawer</DrawerTitle>
                            <DrawerDescription>
                              Useful when a bottom sheet works better than a full dialog.
                            </DrawerDescription>
                          </DrawerHeader>
                          <div className="px-4">
                            <Item variant="muted">
                              <ItemContent>
                                <ItemTitle>Draft summary</ItemTitle>
                                <ItemDescription>
                                  6 changed sections, 2 validation warnings, 0 blockers.
                                </ItemDescription>
                              </ItemContent>
                            </Item>
                          </div>
                          <DrawerFooter>
                            <Button onClick={() => toast("Drawer action accepted")}>
                              Continue
                            </Button>
                            <DrawerClose asChild>
                              <Button variant="outline">Dismiss</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Open alert dialog</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogMedia>
                              <RiCloseCircleLine />
                            </AlertDialogMedia>
                            <AlertDialogTitle>Archive the current preview?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This confirms a destructive-style action using the generated alert dialog API.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction variant="destructive">
                              Archive
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button variant="secondary" onClick={() => setCommandOpen(true)}>
                        <RiCommandLine data-icon="inline-start" />
                        Open command palette
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Menus and Context</CardTitle>
                      <CardDescription>
                        Dropdown menu, context menu, and supporting surface patterns.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                      <div className="flex flex-wrap gap-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">Dropdown menu</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuGroup>
                              <DropdownMenuItem onSelect={() => toast("Preview duplicated")}>
                                Duplicate
                                <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => toast("Share panel opened")}>
                                Share
                                <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive">
                              Remove block
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <div className="flex min-h-24 flex-1 items-center justify-center rounded-none border border-dashed px-4 text-center text-muted-foreground">
                              Right click or long press this surface
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuLabel>Context actions</ContextMenuLabel>
                            <ContextMenuItem onSelect={() => toast("Layer duplicated")}>
                              Duplicate
                              <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => toast("Inspector opened")}>
                              Inspect
                              <ContextMenuShortcut>I</ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem>Pin to workspace</ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </div>

                      <Card className="border-dashed">
                        <CardHeader>
                          <CardTitle>Supporting primitives</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                          <div className="flex flex-col gap-3">
                            <div className="font-medium">Popover</div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Open popover
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <PopoverHeader>
                                  <PopoverTitle>Compact panel</PopoverTitle>
                                  <PopoverDescription>
                                    Popovers are useful for anchored, low-friction settings.
                                  </PopoverDescription>
                                </PopoverHeader>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="flex flex-col gap-3">
                            <div className="font-medium">Hover card</div>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Preview profile
                                </Button>
                              </HoverCardTrigger>
                              <HoverCardContent>
                                Hover cards expose richer context without stealing focus.
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </section>

                <section id="inventory" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Component Inventory</CardTitle>
                      <CardDescription>
                        Every installed shadcn component currently present in this workspace.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-80 rounded-none border p-4">
                        <div className="flex flex-wrap gap-2">
                          {installedComponents.map((component) => (
                            <Badge key={component} variant="secondary">
                              {component}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                      <CardDescription>
                        A quick index of what this page is meant to show.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <ItemGroup>
                        {notes.map((note, index) => (
                          <Item key={note} variant={index % 2 === 0 ? "outline" : "muted"} size="sm">
                            <ItemMedia variant="icon">
                              {index % 2 === 0 ? <RiCheckboxCircleLine /> : <RiInformationLine />}
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>Preview note {index + 1}</ItemTitle>
                              <ItemDescription>{note}</ItemDescription>
                            </ItemContent>
                          </Item>
                        ))}
                      </ItemGroup>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" onClick={() => toast("Inventory copied to clipboard")}>
                        Copy inventory summary
                      </Button>
                    </CardFooter>
                  </Card>
                </section>
              </div>
            </main>
          </div>

          <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
            <CommandInput placeholder="Search components, sections, or actions..." />
            <CommandList>
              <CommandEmpty>No result found.</CommandEmpty>
              <CommandGroup heading="Sections">
                {sectionLinks.map((section) => (
                  <CommandItem
                    key={section.id}
                    onSelect={() => {
                      document.querySelector(`#${section.id}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                      setCommandOpen(false)
                    }}
                  >
                    {section.label}
                    <CommandShortcut>Jump</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Actions">
                <CommandItem
                  onSelect={() => {
                    setTheme("light")
                    setCommandOpen(false)
                  }}
                >
                  Switch to light theme
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setTheme("dark")
                    setCommandOpen(false)
                  }}
                >
                  Switch to dark theme
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    toast("Sample toast triggered from command palette")
                    setCommandOpen(false)
                  }}
                >
                  Trigger sample toast
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>

          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </DirectionProvider>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-none border border-dashed p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-heading text-2xl">{value}</div>
    </div>
  )
}

export default App
