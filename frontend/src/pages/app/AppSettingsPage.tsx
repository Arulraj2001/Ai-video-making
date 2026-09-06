import React, { useState } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Select, Switch } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Feedback";
import { useApp } from "../../context/AppContext";
import { Save } from "lucide-react";

export const AppSettingsPage: React.FC = () => {
  const { themePreference, setThemePreference } = useApp();
  const [defaultAspect, setDefaultAspect] = useState("16:9");
  const [autoSave, setAutoSave] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Studio Settings"
        subtitle="Manage canvas defaults, theme appearance, and rendering preferences."
      />

      {saved && (
        <Alert type="success" title="Preferences Saved" className="mb-6">
          Your studio configuration has been updated.
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card variant="settings" className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-[var(--color-text)] font-display">
            Appearance & Theme
          </h3>

          <Select
            label="Visual Theme"
            value={themePreference}
            onChange={(e) => setThemePreference(e.target.value as any)}
          >
            <option value="light">Warm Light (Linen & Petrol)</option>
            <option value="dark">Cinematic Dark (Deep Petrol & Radiant Linen)</option>
            <option value="system">System Preference (Auto)</option>
          </Select>
        </Card>

        <Card variant="settings" className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-[var(--color-text)] font-display">
            Canvas & Render Defaults
          </h3>

          <Select
            label="Default Canvas Aspect Ratio"
            value={defaultAspect}
            onChange={(e) => setDefaultAspect(e.target.value)}
          >
            <option value="16:9">16:9 Widescreen (1920x1080)</option>
            <option value="9:16">9:16 Vertical (1080x1920)</option>
            <option value="1:1">1:1 Square (1080x1080)</option>
          </Select>

          <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-4">
            <Switch
              label="Enable Real-Time Background Autosave"
              checked={autoSave}
              onChange={setAutoSave}
            />
            <Switch
              label="Hardware Acceleration for Timeline Previews"
              checked={hardwareAcceleration}
              onChange={setHardwareAcceleration}
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save size={14} />}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
