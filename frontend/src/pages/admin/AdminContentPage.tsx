import React from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";

export const AdminContentPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Content Moderation & Review"
        subtitle="Review flagged scene prompts, safety policy reports, and generation audits."
      />

      <Card variant="admin" className="p-8 text-center text-xs text-[var(--color-text-muted)]">
        No content flags or prompt violations reported across active video sessions.
      </Card>
    </div>
  );
};
