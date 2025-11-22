"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Palette, Mail, HardDrive, Shield, Flag, Save, Send } from "lucide-react"

export default function SettingsPage() {
  const [branding, setBranding] = useState({
    logo: "",
    name: "Faculty Appraisal System",
    primaryColor: "#007bff"
  })

  const [emailTemplates, setEmailTemplates] = useState({
    scoresSent: "Dear {faculty_name},\n\nYour appraisal scores have been sent. Total: {total_score}\n\nBest regards,\nAdmin",
    appealReceived: "Dear {evaluator_name},\n\nAn appeal has been submitted for appraisal {appraisal_id}.\n\nMessage: {appeal_message}\n\nPlease review.\n\nBest regards,\nSystem",
    approvalConfirmation: "Dear {faculty_name},\n\nYour appraisal has been approved.\n\nBest regards,\nAdmin"
  })

  const [storage, setStorage] = useState({
    baseBucket: "faculty-appraisals",
    provider: "S3"
  })

  const [security, setSecurity] = useState({
    passwordPolicy: "min8chars",
    sessionLifetime: 480, // minutes
    enable2FA: false
  })

  const [featureFlags, setFeatureFlags] = useState({
    impersonation: false,
    forceStatus: false
  })

  const handleSave = (section: string) => {
    // TODO: Implement save functionality
    alert(`${section} settings saved successfully!`)
  }

  const handleTestEmail = () => {
    // TODO: Implement test email
    alert("Test email sent successfully!")
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Operational settings</p>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>Customize system appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  value={branding.logo}
                  onChange={(e) => setBranding(prev => ({ ...prev, logo: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <Label htmlFor="name">System Name</Label>
                <Input
                  id="name"
                  value={branding.name}
                  onChange={(e) => setBranding(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                />
              </div>
              <Button onClick={() => handleSave("Branding")}>
                <Save className="mr-2 h-4 w-4" />
                Save Branding
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>Configure email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="scoresSent">Scores Sent Template</Label>
                <Textarea
                  id="scoresSent"
                  value={emailTemplates.scoresSent}
                  onChange={(e) => setEmailTemplates(prev => ({ ...prev, scoresSent: e.target.value }))}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="appealReceived">Appeal Received Template</Label>
                <Textarea
                  id="appealReceived"
                  value={emailTemplates.appealReceived}
                  onChange={(e) => setEmailTemplates(prev => ({ ...prev, appealReceived: e.target.value }))}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="approvalConfirmation">Approval Confirmation Template</Label>
                <Textarea
                  id="approvalConfirmation"
                  value={emailTemplates.approvalConfirmation}
                  onChange={(e) => setEmailTemplates(prev => ({ ...prev, approvalConfirmation: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSave("Email Templates")}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Templates
                </Button>
                <Button variant="outline" onClick={handleTestEmail}>
                  <Send className="mr-2 h-4 w-4" />
                  Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage
              </CardTitle>
              <CardDescription>File storage configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="baseBucket">Base Bucket</Label>
                <Input
                  id="baseBucket"
                  value={storage.baseBucket}
                  onChange={(e) => setStorage(prev => ({ ...prev, baseBucket: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select value={storage.provider} onValueChange={(value) => setStorage(prev => ({ ...prev, provider: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S3">Amazon S3</SelectItem>
                    <SelectItem value="GCS">Google Cloud Storage</SelectItem>
                    <SelectItem value="Local">Local Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleSave("Storage")}>
                <Save className="mr-2 h-4 w-4" />
                Save Storage
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Auth & Security
              </CardTitle>
              <CardDescription>Authentication and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="passwordPolicy">Password Policy</Label>
                <Select value={security.passwordPolicy} onValueChange={(value) => setSecurity(prev => ({ ...prev, passwordPolicy: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="min8chars">Minimum 8 characters</SelectItem>
                    <SelectItem value="strong">Strong (uppercase, lowercase, number, symbol)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sessionLifetime">Session Lifetime (minutes)</Label>
                <Input
                  id="sessionLifetime"
                  type="number"
                  value={security.sessionLifetime}
                  onChange={(e) => setSecurity(prev => ({ ...prev, sessionLifetime: parseInt(e.target.value) }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable2FA"
                  checked={security.enable2FA}
                  onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, enable2FA: checked }))}
                />
                <Label htmlFor="enable2FA">Enable 2FA</Label>
              </div>
              <Button onClick={() => handleSave("Security")}>
                <Save className="mr-2 h-4 w-4" />
                Save Security
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>Enable or disable experimental features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="impersonation"
                  checked={featureFlags.impersonation}
                  onCheckedChange={(checked) => setFeatureFlags(prev => ({ ...prev, impersonation: checked }))}
                />
                <Label htmlFor="impersonation">Enable User Impersonation (dev only)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="forceStatus"
                  checked={featureFlags.forceStatus}
                  onCheckedChange={(checked) => setFeatureFlags(prev => ({ ...prev, forceStatus: checked }))}
                />
                <Label htmlFor="forceStatus">Enable Force Status Actions</Label>
              </div>
              <Button onClick={() => handleSave("Feature Flags")}>
                <Save className="mr-2 h-4 w-4" />
                Save Features
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}