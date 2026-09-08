import React from "react";
import { LegalPageLayout } from "../../components/public/LegalPageLayout";
import { Link } from "../../router/Router";
import { Lock, EyeOff, Terminal } from "lucide-react";

export const SecurityPage: React.FC = () => {
  const toc = [
    { id: "principles", title: "1. Security Principles" },
    { id: "encryption", title: "2. Encryption at Rest & In Transit" },
    { id: "byok-vault", title: "3. The BYOK Secret Key Vault" },
    { id: "local-gpu-sandboxing", title: "4. Local GPU Sandboxing" },
    { id: "auth-rbac", title: "5. Identity & Zero-Trust Access" },
    { id: "vulnerability-disclosure", title: "6. Responsible Disclosure" },
  ];

  const summaryPoints = [
    "Enterprise Encryption: All data in transit is protected by TLS 1.3; all project metadata and credentials are encrypted at rest with AES-256.",
    "Isolated BYOK Secret Vault: Your personal provider keys are encrypted with dedicated salt hashes and decrypted only during ephemeral worker execution.",
    "Local GPU Sandboxing: Intermediate diffusion latent tensors and render caches stay strictly in your local VRAM and physical NVMe drive.",
    "Zero-Trust Identity: Role-based access control (RBAC), short-lived Firebase tokens, and IP-isolated admin routing.",
    "Continuously Audited: Regular dependency vulnerability scanning via automated CI/CD security pipelines.",
  ];

  return (
    <LegalPageLayout
      badge="Technical Security Architecture"
      title="Security & Data Protection Standards"
      lead="An in-depth overview of the engineering controls, encryption protocols, and zero-trust perimeters designed to safeguard creator assets and API credentials on ScenoraEdits."
      lastUpdated="September 8, 2026"
      version="2.4.0"
      readTime="7 min read"
      summaryPoints={summaryPoints}
      toc={toc}
    >
      {/* 1. Principles */}
      <section id="principles" className="legal-section">
        <h2>
          <span className="section-num">01</span>
          <span>Core Security Principles</span>
        </h2>
        <p>
          ScenoraEdits is built upon three non-negotiable security tenets:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex flex-col gap-2">
            <Lock className="text-[#FF6B00]" size={20} />
            <h4 className="text-sm font-bold text-[var(--color-text)]">Least Privilege</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">Zero excess permissions across internal databases and API dispatch workers.</p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex flex-col gap-2">
            <EyeOff className="text-purple-500" size={20} />
            <h4 className="text-sm font-bold text-[var(--color-text)]">Zero Knowledge</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">We cannot read your raw BYOK keys once committed to the encrypted secret vault.</p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex flex-col gap-2">
            <Terminal className="text-emerald-500" size={20} />
            <h4 className="text-sm font-bold text-[var(--color-text)]">Local Sovereignty</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">Local GPU computations never mirror intermediate raw video buffers to cloud disks.</p>
          </div>
        </div>
      </section>

      {/* 2. Encryption */}
      <section id="encryption" className="legal-section">
        <h2>
          <span className="section-num">02</span>
          <span>Encryption at Rest &amp; in Transit</span>
        </h2>
        <p>
          All network ingress and egress connections to ScenoraEdits endpoints require modern cryptographic standards:
        </p>
        <ul>
          <li>
            <strong>Data in Transit:</strong> 100% of HTTPS and WebSocket traffic is protected via <strong>TLS 1.3</strong> (with TLS 1.2 fallback using strict forward-secrecy cipher suites like ECDHE-RSA-AES128-GCM-SHA256). Non-secure HTTP requests are automatically rewritten and redirected with HSTS headers.
          </li>
          <li>
            <strong>Data at Rest:</strong> Database records, Video Bible manifests, and user project metadata are stored in Google Cloud Firestore and encrypted with <strong>AES-256</strong> with Google-managed key infrastructure.
          </li>
        </ul>
      </section>

      {/* 3. The BYOK Vault */}
      <section id="byok-vault" className="legal-section">
        <h2>
          <span className="section-num">03</span>
          <span>The BYOK Secret Key Vault</span>
        </h2>
        <p>
          Because ScenoraEdits empowers creators to bring their own API keys, our credential protection architecture is subject to rigorous isolation:
        </p>
        <div className="legal-callout primary">
          <div>
            <strong>Client-Side Zero-Leakage:</strong> Your decrypted third-party API keys are never bundled into client browser JavaScript artifacts, DOM nodes, or analytics tracking payloads. Decryption occurs strictly inside isolated backend process boundaries during synthesis dispatch.
          </div>
        </div>
        <ul>
          <li>Keys are stored in an encrypted sub-collection indexed only by salted account hash.</li>
          <li>In the client dashboard, keys are permanently masked (e.g., `key-••••••••••••••••3A9F`).</li>
          <li>You can revoke or rotate any connected key instantly with one click from <Link to="/app/api-keys" className="text-[#FF6B00] font-semibold hover:underline">API Key Settings</Link>.</li>
        </ul>
      </section>

      {/* 4. Local GPU Sandboxing */}
      <section id="local-gpu-sandboxing" className="legal-section">
        <h2>
          <span className="section-num">04</span>
          <span>Local GPU Sandboxing &amp; Worker Isolation</span>
        </h2>
        <p>
          When you run our local background engine on your NVIDIA RTX hardware:
        </p>
        <ul>
          <li>
            The local worker daemon binds strictly to your loopback address (`127.0.0.1`), rejecting external non-local connections.
          </li>
          <li>
            Model weights loaded into your GPU memory (VRAM) reside strictly in your operating system&rsquo;s physical graphics address space.
          </li>
          <li>
            Rendered MP4 and PNG frames are written to your local working directory and never uploaded to public bucket storage unless explicitly shared by you.
          </li>
        </ul>
      </section>

      {/* 5. Identity & RBAC */}
      <section id="auth-rbac" className="legal-section">
        <h2>
          <span className="section-num">05</span>
          <span>Identity, Authentication &amp; Zero-Trust Access</span>
        </h2>
        <p>
          Our access perimeter is governed by Firebase Enterprise Authentication:
        </p>
        <ul>
          <li>Password hashing utilizes multi-round bcrypt/scrypt algorithms with individualized cryptographic salts.</li>
          <li>Session tokens expire automatically and are signed with asymmetric RS256 private keys.</li>
          <li>Administrative endpoints (`/admin/*`) are protected by server-side role verification middleware that cross-checks cryptographic UID claims against immutable admin rosters.</li>
        </ul>
      </section>

      {/* 6. Vulnerability Disclosure */}
      <section id="vulnerability-disclosure" className="legal-section">
        <h2>
          <span className="section-num">06</span>
          <span>Responsible Vulnerability Disclosure</span>
        </h2>
        <p>
          We welcome collaboration with cybersecurity researchers. If you identify a potential security vulnerability within our web application, backend API, or local daemon, please report it directly to our security engineers via our <Link to="/contact" className="text-[#FF6B00] font-semibold hover:underline">Support &amp; Security Desk</Link>.
        </p>
        <p>
          We commit to acknowledging valid security reports within twenty-four (24) hours and will not pursue legal action against researchers acting in good faith.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default SecurityPage;
