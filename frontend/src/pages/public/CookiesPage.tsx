import React from "react";
import { LegalPageLayout } from "../../components/public/LegalPageLayout";

export const CookiesPage: React.FC = () => {
  const toc = [
    { id: "what-are-cookies", title: "1. What Are Cookies & Local Storage" },
    { id: "essential-storage", title: "2. Strictly Necessary Storage" },
    { id: "functional-preferences", title: "3. Functional Preferences" },
    { id: "third-party", title: "4. Third-Party Analytics & Cookies" },
    { id: "how-to-manage", title: "5. How to Manage & Clear Storage" },
  ];

  const summaryPoints = [
    "No Invasive Ad Trackers: We DO NOT deploy cross-site advertising trackers or sell your browsing history to third-party ad networks.",
    "Strictly Necessary: We use browser local storage and secure cookies strictly for session authentication and account security.",
    "Functional Preferences: We store your studio UI preferences (Dark/Light mode, timeline zoom level, storyboard card view) locally in your browser.",
    "Full Control: You can clear cookies or local storage at any time through your browser settings without penalty.",
  ];

  return (
    <LegalPageLayout
      badge="Data Storage Disclosure"
      title="Cookie & Local Storage Policy"
      lead="This policy transparently explains how ScenoraEdits uses cookies, web storage, and local caching mechanisms to deliver a fast, secure, and personalized video creation experience."
      lastUpdated="September 8, 2026"
      version="2.4.0"
      readTime="5 min read"
      summaryPoints={summaryPoints}
      toc={toc}
    >
      {/* 1. What Are Cookies */}
      <section id="what-are-cookies" className="legal-section">
        <h2>
          <span className="section-num">01</span>
          <span>What Are Cookies &amp; Local Web Storage</span>
        </h2>
        <p>
          Cookies and Web Storage (such as browser `localStorage` and `sessionStorage`) are small text files and key-value pairs stored on your computer or mobile device when you browse websites.
        </p>
        <p>
          In modern client-side video production applications like ScenoraEdits, Web Storage is crucial for maintaining real-time video project states, draft timeline cuts, and user authentication tokens without constantly reloading pages.
        </p>
      </section>

      {/* 2. Strictly Necessary Storage */}
      <section id="essential-storage" className="legal-section">
        <h2>
          <span className="section-num">02</span>
          <span>Strictly Necessary Storage</span>
        </h2>
        <p>
          These storage keys are essential for the operation of ScenoraEdits. Without them, you cannot log in or save video projects:
        </p>
        <ul>
          <li>
            <strong>Authentication Session (`firebase:authUser:...`):</strong> Maintains your authenticated user credentials securely between page navigations.
          </li>
          <li>
            <strong>CSRF Protection &amp; Security Tokens:</strong> Validates that requests dispatched to our backend originate from your authenticated browser tab.
          </li>
          <li>
            <strong>Active Project Pointer (`scenora_active_project_id`):</strong> Remembers which video timeline project you currently have open in the studio.
          </li>
        </ul>
      </section>

      {/* 3. Functional Preferences */}
      <section id="functional-preferences" className="legal-section">
        <h2>
          <span className="section-num">03</span>
          <span>Functional &amp; Studio Preferences</span>
        </h2>
        <p>
          We store non-identifying UI preference tokens directly in your browser&rsquo;s `localStorage`:
        </p>
        <ul>
          <li>
            <strong>Theme Preference (`scenora_theme_mode`):</strong> Remembers whether you selected Light Mode or Dark Mode.
          </li>
          <li>
            <strong>Sidebar State (`scenora_sidebar_collapsed`):</strong> Remembers if you collapsed the project sidebar to give yourself maximum video timeline canvas width.
          </li>
          <li>
            <strong>Storyboard View Layout (`scenora_storyboard_layout`):</strong> Remembers your preferred card grid or compact table inspection view.
          </li>
          <li>
            <strong>Announcement Bar State (`scenora_announcement_dismissed`):</strong> Remembers when you click the close button on the top release banner.
          </li>
        </ul>
      </section>

      {/* 4. Third-Party */}
      <section id="third-party" className="legal-section">
        <h2>
          <span className="section-num">04</span>
          <span>Third-Party Analytics &amp; Advertising</span>
        </h2>
        <div className="legal-callout success">
          <div>
            <strong>Zero Invasive Tracking:</strong> ScenoraEdits does not use third-party data broker pixels (e.g., Facebook Pixel, TikTok pixel) or behavioral ad networks. We respect creator autonomy.
          </div>
        </div>
        <p>
          If you interact with third-party payment gateways during pass checkout (such as Stripe or BuyMeACoffee), those external domains may set security cookies necessary to verify fraudulent charge prevention.
        </p>
      </section>

      {/* 5. How to Manage */}
      <section id="how-to-manage" className="legal-section">
        <h2>
          <span className="section-num">05</span>
          <span>How to Manage &amp; Clear Cookies</span>
        </h2>
        <p>
          You have full control over your storage. You can configure your browser to reject cookies or delete your local storage cache at any time:
        </p>
        <ul>
          <li><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Third-party cookies &gt; Clear browsing data.</li>
          <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data &gt; Clear Data.</li>
          <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data &gt; Remove All.</li>
        </ul>
        <p>
          Please note that if you clear strictly necessary storage, you will be logged out of your session and will need to sign in again to access your Video Bibles.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default CookiesPage;
