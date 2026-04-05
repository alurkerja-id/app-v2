import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MapsLocation01Icon, UserIcon, LockPasswordIcon } from "@hugeicons/core-free-icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

export function ProfilePage() {
  const [form, setForm] = useState(INITIAL_PROFILE)

  const updateField = <K extends keyof ProfileForm,>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-4xl p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold font-heading">My Profile</h1>
      </div>

      <div className="flex flex-col gap-6">
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
                  Format: 08xxxxxxxxxx atau +628xxxxxxxxxx
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
      </div>
    </div>
  )
}
