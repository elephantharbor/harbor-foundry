/* Harbor Foundry operating dashboard — read-only SPA */
(function () {
  "use strict";

  let SNAP = null;
  const app = document.getElementById("app");
  const nav = document.getElementById("nav");

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusBadge(status) {
    const s = String(status || "");
    const key = s.toLowerCase().replace(/\s+/g, "-");
    const map = {
      operating: "badge-operating",
      building: "badge-building",
      researching: "badge-researching",
      "waiting-on-evidence": "badge-waiting",
      "waiting-on-human-action": "badge-waiting",
      paused: "badge-paused",
      closed: "badge-closed",
    };
    const cls = map[key] || "badge-waiting";
    return `<span class="badge ${cls}">${esc(s)}</span>`;
  }

  function fmtUpdated(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return esc(iso);
      return d.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch (_) {
      return esc(iso);
    }
  }

  function setActive(view) {
    nav.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("active", b.dataset.view === view);
    });
  }

  function renderOverview(s) {
    const m = s.metrics || {};
    const attention = s.needsHumanAttention || [];
    let attentionHtml;
    if (!attention.length) {
      attentionHtml = `<div class="empty"><strong>Nothing needs your attention</strong>No genuine decisions, gates, or blockers right now.</div>`;
    } else {
      attentionHtml = `<ul>${attention.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`;
    }

    const approvals = (s.approvalHistory || [])
      .map(
        (a) => `<div class="callout ok">
        <strong>${esc(a.date)} · ${esc(a.subject)}</strong><br/>
        Approver: ${esc(a.approver)}. ${esc(a.summary)}
      </div>`
      )
      .join("");

    return `
      <h2 class="section-title">Overview</h2>
      <div class="card">
        <h2>Mission</h2>
        <p class="plain">${esc(s.mission)}</p>
      </div>
      <div class="kpi-row">
        <div class="kpi"><div class="label">Researching</div><div class="val">${esc(m.researching)}</div><div class="hint">Active Scout nominations</div></div>
        <div class="kpi"><div class="label">Under challenge</div><div class="val">${esc(m.underChallenge)}</div><div class="hint">Open red-team packets</div></div>
        <div class="kpi"><div class="label">Awaiting approval</div><div class="val">${esc(m.awaitingApproval)}</div><div class="hint">Memos for Thomas</div></div>
        <div class="kpi"><div class="label">Active sprints</div><div class="val">${esc(m.activeSprints)}</div><div class="hint">Staffed validation</div></div>
        <div class="kpi"><div class="label">Operating ventures</div><div class="val">${esc(m.operatingVentures)}</div><div class="hint">Live products</div></div>
        <div class="kpi"><div class="label">Setaside sales</div><div class="val">${esc(m.setasideSales)}</div><div class="hint">Cash received</div></div>
        <div class="kpi"><div class="label">Building (count)</div><div class="val">${esc(m.building)}</div><div class="hint">Separate from sprint staff</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card">
          <h2>Current objective</h2>
          <p class="plain">${esc(s.currentObjective)}</p>
        </div>
        <div class="card">
          <h2>Current status</h2>
          <p class="plain">${esc(s.currentStatus)}</p>
        </div>
      </div>
      <div class="card" style="margin-top:10px">
        <h2>Needs your attention</h2>
        <p class="dim" style="margin:0 0 8px;font-size:11px">Only genuine decisions, gates, or blockers — not routine activity.</p>
        ${attentionHtml}
      </div>
      <div class="card" style="margin-top:10px">
        <h2>Approval history</h2>
        ${approvals || `<p class="muted">None recorded.</p>`}
      </div>
    `;
  }

  function renderPipeline(s) {
    const stages = (s.pipelineStages || [])
      .map((st) => {
        const gate = st.humanGate
          ? `<span class="badge badge-gate">Human gate</span>`
          : `<span class="badge badge-empty">Auto</span>`;
        return `<div class="stage-row${st.humanGate ? " gate" : ""}">
          <div><div class="name">${esc(st.name)}</div><div class="dim" style="font-size:11px">${esc(st.owner)}</div></div>
          <div class="desc">${esc(st.description)}</div>
          <div>${gate}</div>
        </div>`;
      })
      .join("");

    const items = (s.pipelineItems || [])
      .map((it) => {
        return `<div class="item-card">
          <div class="head">
            <h3 class="title">${esc(it.name)}</h3>
            ${statusBadge(it.status)}
            <span class="badge badge-empty">${esc(it.stage)}</span>
          </div>
          <p class="plain">${esc(it.summary)}</p>
          <div class="meta-grid">
            <div class="k">Owner</div><div class="v">${esc(it.owner)}</div>
            ${it.incumbent ? `<div class="k">Incumbent</div><div class="v">${esc(it.incumbent)}</div>` : ""}
            <div class="k">Updated</div><div class="v">${esc(it.updated)}</div>
          </div>
        </div>`;
      })
      .join("");

    const rej = s.rejections || {};
    const closed03 = (rej.closed20260903 || [])
      .map(
        (r) => `<tr><td><strong>${esc(r.name)}</strong></td><td>${esc(r.reason)}</td></tr>`
      )
      .join("");
    const empties = (rej.emptyScreens || [])
      .map((e) => {
        const chips = (e.names || []).map((n) => `<span class="chip">${esc(n)}</span>`).join("");
        return `<div class="item-card">
          <div class="head">
            <h3 class="title">${esc(e.label)}</h3>
            <span class="badge badge-empty">EMPTY</span>
          </div>
          <div class="chip-list">${chips}</div>
          <p class="plain" style="margin-top:8px">${esc(e.why)}</p>
        </div>`;
      })
      .join("");

    const concur = rej.concur
      ? `<div class="callout warn"><strong>${esc(rej.concur.name)}</strong> · Closed ${esc(rej.concur.closed)}<br/>${esc(rej.concur.reason)}</div>`
      : "";

    return `
      <h2 class="section-title">Pipeline</h2>
      <div class="card">
        <h2>Lifecycle</h2>
        <p class="dim" style="margin:0 0 8px;font-size:11px">Scout, research, and challenge run without Thomas. Only sprint staffing needs the memo gate.</p>
        ${stages}
      </div>
      <h2 class="section-title" style="margin-top:16px">In flight</h2>
      <div class="stack">${items}</div>
      <h2 class="section-title" style="margin-top:16px">Rejections</h2>
      <div class="card">
        <h2>Closed 2026-09-03</h2>
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Name</th><th>Why closed</th></tr></thead>
            <tbody>${closed03}</tbody>
          </table>
        </div>
        ${concur}
      </div>
      <h2 class="section-title" style="margin-top:16px">EMPTY screens</h2>
      ${empties}
      <div class="card">
        <h2>Institutional summary</h2>
        <p class="plain muted">${esc(rej.institutionalSummary)}</p>
      </div>
    `;
  }

  function renderVentures(s) {
    const cards = (s.ventures || [])
      .map((v) => {
        if (v.id === "setaside") {
          const listing = v.listing || {};
          const cash = v.cash || {};
          const books = v.books || {};
          const traffic = v.traffic || {};
          return `<div class="venture-card">
            <div class="head">
              <h3 class="title">${esc(v.name)}</h3>
              ${statusBadge(v.status)}
              <span class="muted">Owner: ${esc(v.owner)}</span>
            </div>
            <p class="plain"><em>${esc(v.tagline)}</em></p>
            <p class="plain">${esc(v.wedge)}</p>
            <div class="meta-grid">
              <div class="k">Shop</div><div class="v">${esc(v.brand)} (${esc(v.etsyShop)}) on Etsy</div>
              <div class="k">Listing</div><div class="v"><a href="${esc(listing.url)}" target="_blank" rel="noopener noreferrer">${esc(listing.state)} · ${esc(listing.price)} · ${esc(listing.stock)} stock · ${esc(listing.category)}</a></div>
              <div class="k">Cash</div><div class="v">${esc(cash.sales)} · ${esc(cash.orders)} orders · ${esc(cash.reviews)} reviews <span class="dim">(verified ${esc(cash.lastVerified)})</span></div>
              <div class="k">Books</div><div class="v">${esc(books.in)} in / ${esc(books.out)} out / ${esc(books.remaining)} remaining</div>
              <div class="k">Posture</div><div class="v">${esc(v.posture)}</div>
              <div class="k">Next</div><div class="v">${esc(v.next)}</div>
            </div>
            <div class="traffic-block">
              <div><span class="muted">Shop Sep 1–4:</span> ${esc(traffic.shopStatsSep1to4)}</div>
              <div><span class="muted">Listing last 30 days:</span> ${esc(traffic.listingLast30Days)}</div>
              <div><span class="muted">Dashboard last 7 days (Sep 4):</span> ${esc(traffic.dashboardLast7DaysAsOfSep4)}</div>
            </div>
            <p class="dim" style="margin:8px 0 0;font-size:11px">${esc(v.notes)}</p>
          </div>`;
        }

        return `<div class="venture-card">
          <div class="head">
            <h3 class="title">${esc(v.name)}</h3>
            ${statusBadge(v.status)}
            <span class="muted">Owner: ${esc(v.owner)}</span>
          </div>
          <p class="plain">${esc(v.wedge)}</p>
          <div class="meta-grid">
            <div class="k">Incumbent</div><div class="v">${esc(v.incumbent)}</div>
            <div class="k">Approved</div><div class="v">${esc(v.approved)}</div>
            <div class="k">Product</div><div class="v">${esc(v.productShape)}</div>
            <div class="k">Interviews</div><div class="v">${esc(v.interviews)}</div>
            <div class="k">Decision</div><div class="v">${esc(v.decision)}</div>
            <div class="k">Cap</div><div class="v">${esc(v.cap)}</div>
            <div class="k">Next</div><div class="v">${esc(v.next)}</div>
          </div>
        </div>`;
      })
      .join("");

    return `<h2 class="section-title">Ventures</h2><div class="stack">${cards}</div>`;
  }

  function renderEvidence(s) {
    const cards = (s.evidenceDecisions || [])
      .map(
        (e) => `<div class="ev-card">
        <h3 class="title" style="margin:0 0 4px;font-size:14px;font-weight:650">${esc(e.title)}</h3>
        <div class="step"><div class="k">Evidence</div><div class="v">${esc(e.evidence)}</div></div>
        <div class="step"><div class="k">Interpretation</div><div class="v">${esc(e.interpretation)}</div></div>
        <div class="step"><div class="k">Decision</div><div class="v">${esc(e.decision)}</div></div>
      </div>`
      )
      .join("");
    return `
      <h2 class="section-title">Evidence &amp; Decisions</h2>
      <p class="dim" style="margin:0 0 10px;font-size:12px">Pattern: evidence files → Calder interpretation → Thomas gate only when staffing a sprint → explicit Closed when kill. Challenge is risk input, not a veto.</p>
      <div class="stack">${cards}</div>
    `;
  }

  function renderLessons(s) {
    const cards = (s.lessons || [])
      .map(
        (l) => `<div class="lesson">
        <div class="conclusion">${esc(l.learning)}</div>
        <div class="row"><div class="k">Experience</div><div class="v">${esc(l.experience)}</div></div>
        <div class="row"><div class="k">Evidence</div><div class="v">${esc(l.evidence)}</div></div>
        <div class="row"><div class="k">Learning</div><div class="v">${esc(l.learning)}</div></div>
        <div class="row"><div class="k">Change</div><div class="v">${esc(l.change)}</div></div>
      </div>`
      )
      .join("");
    return `
      <h2 class="section-title">Lessons</h2>
      <p class="dim" style="margin:0 0 10px;font-size:12px">Experience → Evidence → Learning → Change. Decision-relevant only.</p>
      <div class="stack">${cards}</div>
    `;
  }

  function renderDocs(s) {
    const d = s.docs || {};
    const how = (d.howItWorks || []).map((x) => `<li>${esc(x)}</li>`).join("");
    const team = (d.team || [])
      .map(
        (t) => `<tr><td><strong>${esc(t.name)}</strong></td><td>${esc(t.role)}</td><td>${esc(t.owns)}</td></tr>`
      )
      .join("");
    return `
      <h2 class="section-title">Docs</h2>
      <details class="doc-sec" open>
        <summary>How Harbor Foundry works</summary>
        <ul>${how}</ul>
      </details>
      <details class="doc-sec" open>
        <summary>Team (Cycle 3)</summary>
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Name</th><th>Role</th><th>Owns</th></tr></thead>
            <tbody>${team}</tbody>
          </table>
        </div>
      </details>
      <details class="doc-sec">
        <summary>Provenance</summary>
        <p class="plain muted">${esc(d.provenance)}</p>
      </details>
    `;
  }

  const VIEWS = {
    overview: renderOverview,
    pipeline: renderPipeline,
    ventures: renderVentures,
    evidence: renderEvidence,
    lessons: renderLessons,
    docs: renderDocs,
  };

  function show(view) {
    const fn = VIEWS[view] || VIEWS.overview;
    setActive(view);
    app.innerHTML = fn(SNAP);
    try {
      history.replaceState(null, "", "#" + view);
    } catch (_) {}
  }

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-view]");
    if (!btn || !SNAP) return;
    show(btn.dataset.view);
  });

  async function boot() {
    try {
      const res = await fetch("data/snapshot.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      SNAP = await res.json();
      const el = document.getElementById("last-updated");
      if (el) el.textContent = "Updated " + fmtUpdated(SNAP.lastUpdated);
      const hash = (location.hash || "#overview").slice(1);
      show(VIEWS[hash] ? hash : "overview");
    } catch (err) {
      app.innerHTML = `<div class="error">Could not load snapshot.json (${esc(err.message)}). Serve this folder over HTTP (python3 -m http.server) — file:// will block fetch.</div>`;
    }
  }

  boot();
})();
