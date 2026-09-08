import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "../../components/ui/Headers";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Feedback";
import { LoadingState } from "../../components/ui/StateViews";
import {
  api,
  type ContactInquiryRecord,
} from "../../services/api";
import {
  RefreshCw,
  Search,
  Mail,
  ExternalLink,
  Trash2,
  X,
  Save,
} from "lucide-react";

export const AdminMessagesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [inquiries, setInquiries] = useState<ContactInquiryRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Selected Inquiry Modal
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiryRecord | null>(null);
  const [modalStatus, setModalStatus] = useState<"unread" | "read" | "replied" | "archived">("unread");
  const [modalNotes, setModalNotes] = useState<string>("");
  const [savingModal, setSavingModal] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const data = await api.getAdminInquiries(statusFilter);
      setInquiries(data);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to load creator inquiries." });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleOpenModal = (inq: ContactInquiryRecord) => {
    setSelectedInquiry(inq);
    setModalStatus(inq.status);
    setModalNotes(inq.admin_notes || "");

    // Auto-mark as read if currently unread
    if (inq.status === "unread") {
      api.updateAdminInquiry(inq.inquiry_id, { status: "read" }).then((updated) => {
        setInquiries((prev) =>
          prev.map((item) => (item.inquiry_id === updated.inquiry_id ? updated : item))
        );
        setSelectedInquiry(updated);
        setModalStatus(updated.status);
      }).catch(() => {});
    }
  };

  const handleSaveModal = async () => {
    if (!selectedInquiry) return;
    try {
      setSavingModal(true);
      const updated = await api.updateAdminInquiry(selectedInquiry.inquiry_id, {
        status: modalStatus,
        admin_notes: modalNotes.trim() || undefined,
      });
      setSelectedInquiry(updated);
      setInquiries((prev) =>
        prev.map((item) => (item.inquiry_id === updated.inquiry_id ? updated : item))
      );
      setFeedback({ type: "success", text: `Inquiry ${updated.inquiry_id} status updated to ${updated.status}.` });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to update inquiry." });
    } finally {
      setSavingModal(false);
    }
  };

  const handleDelete = async (inquiryId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this inquiry?")) return;
    try {
      setDeletingId(inquiryId);
      await api.deleteAdminInquiry(inquiryId);
      setInquiries((prev) => prev.filter((item) => item.inquiry_id !== inquiryId));
      if (selectedInquiry?.inquiry_id === inquiryId) {
        setSelectedInquiry(null);
      }
      setFeedback({ type: "success", text: "Inquiry successfully deleted." });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to delete inquiry." });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchesSearch =
        inq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [inquiries, searchQuery]);

  const metrics = useMemo(() => {
    const total = inquiries.length;
    const unread = inquiries.filter((i) => i.status === "unread").length;
    const replied = inquiries.filter((i) => i.status === "replied").length;
    const archived = inquiries.filter((i) => i.status === "archived").length;
    return { total, unread, replied, archived };
  }, [inquiries]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Creator Inquiries & Support Messages"
          subtitle="Review questions from the public Contact page, GPU setup requests, and billing inquiries."
        />
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
          onClick={() => loadInquiries()}
        >
          Refresh
        </Button>
      </div>

      {feedback && (
        <Alert type={feedback.type} title={feedback.type === "success" ? "Success" : "Notice"}>
          {feedback.text}
        </Alert>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-bold meta-mono text-[var(--color-text-muted)] uppercase">
            Total Inquiries
          </span>
          <div className="text-2xl font-black font-display text-[var(--color-text)]">
            {metrics.total}
          </div>
        </Card>

        <Card className="p-4 space-y-1 border-l-4 border-amber-500">
          <span className="text-[11px] font-bold meta-mono text-amber-500 uppercase">
            Unread
          </span>
          <div className="text-2xl font-black font-display text-amber-500">
            {metrics.unread}
          </div>
        </Card>

        <Card className="p-4 space-y-1 border-l-4 border-emerald-500">
          <span className="text-[11px] font-bold meta-mono text-emerald-500 uppercase">
            Replied
          </span>
          <div className="text-2xl font-black font-display text-emerald-500">
            {metrics.replied}
          </div>
        </Card>

        <Card className="p-4 space-y-1 border-l-4 border-slate-500">
          <span className="text-[11px] font-bold meta-mono text-slate-400 uppercase">
            Archived
          </span>
          <div className="text-2xl font-black font-display text-[var(--color-text)]">
            {metrics.archived}
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Segmented Tabs */}
          <div className="scenora-tab-bar">
            {[
              { id: "all", label: "All Messages", count: metrics.total },
              { id: "unread", label: "Unread", count: metrics.unread },
              { id: "read", label: "Read", count: undefined },
              { id: "replied", label: "Replied", count: metrics.replied },
              { id: "archived", label: "Archived", count: metrics.archived },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`scenora-tab-btn ${isActive ? "active" : ""}`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="tab-count">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by name, email, text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftElement={<Search size={15} />}
            />
          </div>
        </div>
      </Card>

      {/* Inquiries Table */}
      {loading ? (
        <LoadingState message="Loading creator inquiries..." />
      ) : filteredInquiries.length === 0 ? (
        <Card className="p-12 text-center space-y-2 border border-dashed border-[var(--color-border)]">
          <h4 className="text-sm font-bold text-[var(--color-text)]">No creator inquiries found</h4>
          <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
            {searchQuery
              ? "No messages match your search filter."
              : "No contact messages received under this filter status yet."}
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs">
          <table className="w-full text-left text-xs app-data-table">
            <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] meta-mono uppercase tracking-wider">
              <tr>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold">Creator</th>
                <th className="p-3.5 font-semibold">Topic</th>
                <th className="p-3.5 font-semibold">Message Preview</th>
                <th className="p-3.5 font-semibold">Date</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filteredInquiries.map((inq) => {
                const initials = inq.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "CR";

                return (
                  <tr
                    key={inq.inquiry_id}
                    onClick={() => handleOpenModal(inq)}
                    className="hover:bg-[var(--color-surface-sunken)]/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5">
                      <span className={`scenora-badge ${inq.status}`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center font-bold text-[11px] text-[var(--color-primary)] font-mono shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--color-text)] font-sans">{inq.name}</div>
                          <div className="text-[11px] text-[var(--color-text-muted)] font-mono">{inq.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-[var(--color-surface-sunken)] text-[11px] font-medium text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                        {inq.subject}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs truncate text-[var(--color-text-secondary)]">
                      {inq.message}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-[11px] text-[var(--color-text-muted)] font-mono">
                      {new Date(inq.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenModal(inq)}
                          className="text-xs font-semibold"
                        >
                          View
                        </Button>
                        <button
                          onClick={() => handleDelete(inq.inquiry_id)}
                          disabled={deletingId === inq.inquiry_id}
                          className="icon-action-btn danger"
                          title="Delete inquiry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[var(--color-primary)]">
                    {selectedInquiry.inquiry_id}
                  </span>
                  <span className={`scenora-badge ${selectedInquiry.status}`}>
                    {selectedInquiry.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-display text-[var(--color-text)]">
                  {selectedInquiry.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="icon-action-btn"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Creator Info Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)]">
              <div>
                <span className="text-[10px] font-bold meta-mono text-[var(--color-text-muted)] uppercase block">
                  Sender Name
                </span>
                <div className="text-xs font-bold text-[var(--color-text)] mt-0.5">
                  {selectedInquiry.name}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold meta-mono text-[var(--color-text-muted)] uppercase block">
                  Email Address
                </span>
                <div className="text-xs font-mono text-[var(--color-primary)] mt-0.5">
                  {selectedInquiry.email}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold meta-mono text-[var(--color-text-muted)] uppercase block">
                  Submitted At
                </span>
                <div className="text-xs font-mono text-[var(--color-text-secondary)] mt-0.5">
                  {new Date(selectedInquiry.submitted_at).toLocaleString()}
                </div>
              </div>

              {selectedInquiry.channel_url && (
                <div>
                  <span className="text-[10px] font-bold meta-mono text-[var(--color-text-muted)] uppercase block">
                    Channel / Website
                  </span>
                  <a
                    href={selectedInquiry.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#FF6B00] hover:underline inline-flex items-center gap-1 mt-0.5 truncate max-w-full"
                  >
                    <span>{selectedInquiry.channel_url}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Message Body */}
            <div>
              <span className="text-[10px] font-bold meta-mono text-[var(--color-text-muted)] uppercase block mb-1.5">
                Message Content
              </span>
              <div className="p-4 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Email Reply Action */}
            <div className="pt-2">
              <a
                href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)} - ScenoraEdits Team&body=Hi ${encodeURIComponent(selectedInquiry.name)},%0D%0A%0D%0AThank you for reaching out to ScenoraEdits!%0D%0A%0D%0A`}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white text-xs font-bold transition-all shadow-sm"
              >
                <Mail size={15} />
                <span>Reply to {selectedInquiry.email} via Email Client</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Status & Admin Notes Form */}
            <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-2">
                  Update Status
                </label>
                <div className="scenora-tab-bar w-full grid grid-cols-4 p-1">
                  {(["unread", "read", "replied", "archived"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`scenora-tab-btn justify-center capitalize ${
                        modalStatus === st ? "active" : ""
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Internal Admin Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record internal notes, who replied, or next steps..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(selectedInquiry.inquiry_id)}
                  leftIcon={<Trash2 size={14} />}
                >
                  Delete Inquiry
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  disabled={savingModal}
                  leftIcon={<Save size={15} />}
                  onClick={handleSaveModal}
                  className="font-bold"
                >
                  {savingModal ? "Saving Changes..." : "Save Status & Notes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessagesPage;
