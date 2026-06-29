import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MapsLocation01Icon,
  UserIcon,
  LockPasswordIcon,
  RefreshIcon,
  Copy01Icon,
  Delete02Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type ProfileForm = {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  zip: string
  phoneNumber: string
  taxNumber: string
  name: string
  email: string
}

const INITIAL_PROFILE: ProfileForm = {
  addressLine1: "Jalan Cimanuk",
  addressLine2: "",
  city: "Sragen",
  state: "Jawa Tengah",
  country: "Indonesia",
  zip: "57222",
  phoneNumber: "08562076467",
  taxNumber: "",
  name: "Bayu Hendra Winata",
  email: "bayu.hendra@javan.co.id",
}

type TelegramBot = {
  id: number
  name: string
  username: string
  status: "active" | "inactive"
  paired: boolean
  pairedAt?: string
}

const TELEGRAM_BOTS: TelegramBot[] = [
  {
    id: 1,
    name: "telegram configuration (3)",
    username: "@complianceInfoBot",
    status: "active",
    paired: false,
  },
  {
    id: 2,
    name: "telegram configuration (4)",
    username: "@Testingpubot",
    status: "active",
    paired: true,
    pairedAt: "6/1/2026, 12:07:55 PM",
  },
]

const PAIRING_CODE = "7739-BKXE"

function TelegramTab() {
  const [bots, setBots] = useState<TelegramBot[]>(TELEGRAM_BOTS)
  const [copied, setCopied] = useState(false)
  const [unpairTarget, setUnpairTarget] = useState<TelegramBot | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(PAIRING_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const confirmUnpair = () => {
    if (!unpairTarget) return
    setBots((prev) =>
      prev.map((bot) =>
        bot.id === unpairTarget.id ? { ...bot, paired: false, pairedAt: undefined } : bot
      )
    )
    setUnpairTarget(null)
  }

  return (
    <>
    <AlertDialog open={!!unpairTarget} onOpenChange={(open) => { if (!open) setUnpairTarget(null) }}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Unpair Telegram Bot</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unpair <span className="font-semibold text-foreground">{unpairTarget?.username}</span>? You will no longer receive notifications from this bot.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirmUnpair}>Unpair</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div className="flex flex-col gap-6">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 mb-1">
                Telegram
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Link your account to the workspace Telegram bot to receive notifications (e.g. task reminders).
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0">
              <HugeiconsIcon icon={RefreshIcon} className="size-4" />
              Refresh status
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-5 flex flex-col gap-6">
          {/* Pairing Code */}
          <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-0.5">Your Pairing Code</p>
              <p className="text-xs text-muted-foreground">
                One code applies to all bots in this workspace.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-widest font-mono">
                {PAIRING_CODE}
              </span>
              <Button variant="default" size="sm" onClick={handleCopy}>
                <HugeiconsIcon icon={Copy01Icon} className="size-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="outline" size="sm">
                <HugeiconsIcon icon={RefreshIcon} className="size-4" />
                Regenerate
              </Button>
            </div>
          </div>

          {/* Bot Table */}
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Bot
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pairing
                  </th>
                </tr>
              </thead>
              <tbody>
                {bots.map((bot, index) => (
                  <tr
                    key={bot.id}
                    className={index < bots.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">{bot.name}</p>
                      <p className="text-xs text-muted-foreground">{bot.username}</p>
                    </td>
                    <td className="px-4 py-4">
                      {bot.status === "active" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                          <span className="size-1.5 rounded-full bg-emerald-500 inline-block mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {bot.paired ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="text-emerald-500">✓</span>
                            Paired · {bot.pairedAt}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUnpairTarget(bot)}
                            className="w-fit"
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                            Unpair
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-muted-foreground">
                            Click the link below to open a chat with{" "}
                            <span className="font-semibold text-foreground">{bot.username}</span>
                            , then send the message that already contains the code{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono font-bold">
                              {PAIRING_CODE}
                            </code>
                          </p>
                          <Button size="sm" className="w-fit bg-[#2AABEE] hover:bg-[#229ED9] text-white">
                            <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" />
                            Open in Telegram
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}

export function ProfilePage() {
  const [form, setForm] = useState(INITIAL_PROFILE)

  const updateField = <K extends keyof ProfileForm,>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-4xl p-6 md:p-10">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-normal font-heading">
          <HugeiconsIcon icon={UserIcon} className="size-5 text-muted-foreground" />
          My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your user profile here.
        </p>
      </div>

      <Tabs defaultValue="personal-information">
        <TabsList variant="line" className="mb-6 w-full justify-start border-b border-border rounded-none pb-0 h-auto gap-0">
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="personal-information">Personal Information</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-information">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border py-5">
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={UserIcon} className="size-4 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="profile-name" className="mb-2">Name *</Label>
                  <Input
                    id="profile-name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="profile-email" className="mb-2">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button type="button">Save Personal Information</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border py-5">
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={LockPasswordIcon} className="size-4 text-primary" />
                Password
              </CardTitle>
            </CardHeader>
            <CardContent className="py-5">
              <Alert className="border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-100">
                <AlertDescription>
                  Password changes are disabled in this application because authentication is handled centrally by LDAP.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border py-5">
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={MapsLocation01Icon} className="size-4 text-primary" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="address-line-1" className="mb-2">Address Line 1</Label>
                  <Input
                    id="address-line-1"
                    value={form.addressLine1}
                    onChange={(e) => updateField("addressLine1", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address-line-2" className="mb-2">Address Line 2</Label>
                  <Input
                    id="address-line-2"
                    placeholder="Enter address line 2"
                    value={form.addressLine2}
                    onChange={(e) => updateField("addressLine2", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="mb-2">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="mb-2">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="mb-2">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="zip" className="mb-2">Zip</Label>
                  <Input
                    id="zip"
                    value={form.zip}
                    onChange={(e) => updateField("zip", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone-number" className="mb-2">Phone Number</Label>
                  <Input
                    id="phone-number"
                    value={form.phoneNumber}
                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Format: 08xxxxxxxxxx or +628xxxxxxxxxx
                  </p>
                </div>
                <div>
                  <Label htmlFor="tax-number" className="mb-2">Tax Number</Label>
                  <Input
                    id="tax-number"
                    value={form.taxNumber}
                    onChange={(e) => updateField("taxNumber", e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button type="button">Save Address</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram">
          <TelegramTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
