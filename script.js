const stars = document.getElementById("stars");
if (stars) {
  const starCount = 180;
  for (let i = 0; i < starCount; i += 1) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.setProperty("--x", `${Math.random() * 100}%`);
    star.style.setProperty("--y", `${Math.random() * 100}%`);
    star.style.setProperty("--size", `${1 + Math.random() * 2.2}px`);
    star.style.setProperty("--twinkle", `${2 + Math.random() * 4}s`);
    star.style.setProperty("--delay", `${Math.random() * 4}s`);
    stars.appendChild(star);
  }
}

const cursorDot = document.querySelector(".cursor-dot");
const cursorTrails = Array.from(document.querySelectorAll(".cursor-trail"));
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

const handlePointerMove = (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
};

const handleTouchMove = (event) => {
  const touch = event.touches?.[0];
  if (!touch) return;
  pointer.x = touch.clientX;
  pointer.y = touch.clientY;
};

window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("touchstart", handleTouchMove, { passive: true });
window.addEventListener("touchmove", handleTouchMove, { passive: true });

const positions = Array.from({ length: cursorTrails.length + 1 }).map(() => ({
  x: pointer.x,
  y: pointer.y,
}));

const animate = () => {
  positions[0].x += (pointer.x - positions[0].x) * 0.22;
  positions[0].y += (pointer.y - positions[0].y) * 0.22;

  for (let i = 1; i < positions.length; i += 1) {
    positions[i].x += (positions[i - 1].x - positions[i].x) * 0.2;
    positions[i].y += (positions[i - 1].y - positions[i].y) * 0.2;
  }

  if (cursorDot) {
    cursorDot.style.transform = `translate(${positions[0].x}px, ${positions[0].y}px)`;
  }

  cursorTrails.forEach((el, index) => {
    el.style.transform = `translate(${positions[index + 1].x}px, ${positions[index + 1].y}px)`;
  });

  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);

const orbit = document.querySelector(".orbit");
const iconNodes = Array.from(document.querySelectorAll(".icon-node"));
let orbitRotation = 0;
let anchorFrame = null;
let orbitTweenFrame = null;

const updateOrbit = () => {
  if (!orbit) return;
  const root = document.documentElement;
  root.style.setProperty("--orbit-rotation", `${orbitRotation}deg`);
  root.style.setProperty("--orbit-rotation-neg", `${-orbitRotation}deg`);
  scheduleAnchorUpdate();
};

const stopOrbitTween = () => {
  if (!orbitTweenFrame) return;
  cancelAnimationFrame(orbitTweenFrame);
  orbitTweenFrame = null;
};

const getClosestRotationTarget = (target, from) => {
  let adjusted = target;
  while (adjusted - from > 180) adjusted -= 360;
  while (adjusted - from < -180) adjusted += 360;
  return adjusted;
};

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

const animateOrbitTo = (targetRotation, duration = 520) => {
  stopOrbitTween();
  const startRotation = orbitRotation;
  const destination = getClosestRotationTarget(targetRotation, startRotation);
  const start = performance.now();

  const frame = (now) => {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(progress);
    orbitRotation = startRotation + (destination - startRotation) * eased;
    updateOrbit();
    if (progress < 1) {
      orbitTweenFrame = requestAnimationFrame(frame);
      return;
    }
    orbitRotation = destination;
    updateOrbit();
    orbitTweenFrame = null;
  };

  orbitTweenFrame = requestAnimationFrame(frame);
};

const updateTooltipAnchors = () => {
  if (!orbit) return;
  const orbitRect = orbit.getBoundingClientRect();
  const centerX = orbitRect.left + orbitRect.width / 2;
  const centerY = orbitRect.top + orbitRect.height / 2;
  iconNodes.forEach((node) => {
    const dot = node.querySelector(".icon-dot");
    const nodeRect = node.getBoundingClientRect();
    const targetRect = (dot || node).getBoundingClientRect();
    const nodeCenterX = targetRect.left + targetRect.width / 2;
    const nodeCenterY = targetRect.top + targetRect.height / 2;
    const dx = nodeCenterX - centerX;
    const dy = nodeCenterY - centerY;
    const distance = Math.hypot(dx, dy) || 1;
    const normX = dx / distance;
    const normY = dy / distance;
    node.style.setProperty("--tip-x", `${normX}`);
    node.style.setProperty("--tip-y", `${normY}`);
    node.style.setProperty("--tip-origin-x", `${nodeCenterX - (nodeRect.left + nodeRect.width / 2)}px`);
    node.style.setProperty("--tip-origin-y", `${nodeCenterY - (nodeRect.top + nodeRect.height / 2)}px`);
  });
};

const scheduleAnchorUpdate = () => {
  if (anchorFrame) return;
  anchorFrame = requestAnimationFrame(() => {
    anchorFrame = null;
    updateTooltipAnchors();
  });
};

const placeNodes = () => {
  if (!orbit || iconNodes.length === 0) return;
  const isNarrow = window.innerWidth <= 900;
  const radius = orbit.clientWidth * (isNarrow ? 0.425 : 0.372) + (isNarrow ? 0 : 15);
  const centerX = orbit.clientWidth / 2;
  const centerY = orbit.clientHeight / 2;
  const step = (Math.PI * 2) / iconNodes.length;

  iconNodes.forEach((node, index) => {
    const dot = node.querySelector(".icon-dot");
    const angle = -Math.PI / 2 + index * step;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.transform = "translate(-50%, -50%)";

    // Shift the node so its dot (not the node's box) sits on the ring.
    if (dot) {
      const nodeRect = node.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      const dotOffsetX = dotRect.left + dotRect.width / 2 - (nodeRect.left + nodeRect.width / 2);
      const dotOffsetY = dotRect.top + dotRect.height / 2 - (nodeRect.top + nodeRect.height / 2);
      node.style.left = `${x - dotOffsetX}px`;
      node.style.top = `${y - dotOffsetY}px`;
    }
  });
  scheduleAnchorUpdate();
};

const handleWheel = (event) => {
  if (window.innerWidth <= 900) return;
  // Let scrollable panels and open project modals scroll normally instead of spinning the orbit.
  if (event.target.closest(".tech-panel, .about-panel")) return;
  if (document.querySelector(".project-modal.is-open")) return;
  event.preventDefault();
  stopOrbitTween();
  const delta = event.deltaX - event.deltaY;
  if (delta === 0) return;
  orbitRotation += delta * 0.08;
  updateOrbit();
};

window.addEventListener("wheel", handleWheel, { passive: false });

const orbitTouchState = {
  id: null,
  x: 0,
  y: 0,
};

const handleOrbitTouchStart = (event) => {
  if (window.innerWidth > 900) return;
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  orbitTouchState.id = touch.identifier;
  orbitTouchState.x = touch.clientX;
  orbitTouchState.y = touch.clientY;
  stopOrbitTween();
};

const handleOrbitTouchMove = (event) => {
  if (window.innerWidth > 900) return;
  if (orbitTouchState.id == null) return;
  if (document.querySelector(".project-modal.is-open")) {
    return;
  }
  const touch = Array.from(event.changedTouches || []).find(
    (item) => item.identifier === orbitTouchState.id
  );
  if (!touch) return;
  const deltaX = touch.clientX - orbitTouchState.x;
  const deltaY = touch.clientY - orbitTouchState.y;
  orbitTouchState.x = touch.clientX;
  orbitTouchState.y = touch.clientY;
  const delta = deltaX - deltaY;
  if (delta === 0) return;
  event.preventDefault();
  orbitRotation += delta * 0.08;
  updateOrbit();
};

const handleOrbitTouchEnd = (event) => {
  if (orbitTouchState.id == null) return;
  const endedTouch = Array.from(event.changedTouches || []).find(
    (item) => item.identifier === orbitTouchState.id
  );
  if (!endedTouch) return;
  orbitTouchState.id = null;
};

if (orbit) {
  orbit.addEventListener("touchstart", handleOrbitTouchStart, { passive: true });
  orbit.addEventListener("touchmove", handleOrbitTouchMove, { passive: false });
  orbit.addEventListener("touchend", handleOrbitTouchEnd, { passive: true });
  orbit.addEventListener("touchcancel", handleOrbitTouchEnd, { passive: true });
}

window.addEventListener("resize", () => {
  placeNodes();
  updateOrbit();
});

placeNodes();
updateOrbit();

const viewData = {
  area: [
    {
      label: "Brand & Story",
      tip: "• Built brand narratives and messaging systems that increased media visibility by 100%\n• Produced investor-ready content (decks, scripts, written materials) for executive and fundraising communication\n• Created editorial frameworks for consistent voice across campaigns and channels",
    },
    {
      label: "Content & Creative",
      tip: "• Led narrative-first content strategy that drove 14M+ views across digital platforms\n• Developed multi-format assets (campaign content, white papers, technical edits) to support GTM goals\n• Improved creative throughput by standardizing briefs, templates, and production handoffs",
    },
    {
      label: "Marketing Operations",
      tip: "• Designed Asana-based marketing operations that reduced campaign turnaround by 66%\n• Standardized workflows across teams and markets to increase execution consistency and speed\n• Implemented automations that improved operational efficiency by 78%",
    },
    {
      label: "GTM & Launch\nExecution",
      tip: "• Built GTM systems for founders and growth teams to improve launch readiness and repeatability\n• Coordinated cross-functional launches across product, design, engineering, and marketing\n• Increased outreach and execution performance through playbooks that improved efficiency by 66%",
    },
    {
      label: "Analytics &\nOptimization",
      tip: "• Integrated KPI tracking and reporting systems for real-time campaign and funnel visibility\n• Used performance insights to improve prioritization, delivery cadence, and campaign quality\n• Structured measurement loops that connected creative output to business outcomes",
    },
    {
      label: "Revenue\nOutcomes",
      tip: "• Supported strategic communications tied to a $9M fundraising round\n• Contributed to growth initiatives connected to 1.7M TVL and expanded market visibility\n• Operationalized marketing systems supporting a $100M+ annual revenue pipeline",
    },
    {
      label: "Cross-Functional\nLeadership",
      tip: "• Led execution across 20+ cross-functional projects with clear ownership and accountability\n• Aligned stakeholders across design, marketing, product, and leadership to reduce execution friction\n• Built collaboration rhythms that doubled campaign delivery speed",
    },
    {
      label: "Systems",
      tip: "• Built end-to-end systems that transformed manual workflows into scalable operations\n• Automated recurring processes to reduce coordination overhead by 35%\n• Developed workflow and asset systems that cut file and process handling time by 90%",
    },
  ],
  role: [
    {
      id: "csu",
      label: "Colorado State University\n2014–2018",
      company: "Colorado State University",
      tip: "Colorado State University\nFort Collins, CO\n2014–2018\n• B.A. Journalism & Media Communication\n• B.S. Psychology",
    },
    {
      id: "venture",
      label: "Venture Programs\n2017–2018",
      company: "Colorado State University",
      tip: "Venture programs\nCSU\n2017–2018\n• Venture Accelerator\n• Venture Validator\n• Customer discovery + early GTM validation",
    },
    {
      id: "editorial",
      label: "Editorial\n2015–2018",
      company: "Rocky Mountain Collegian + CSU Student Media",
      tip: "Rocky Mountain Collegian + CSU Student Media\n2015–2018\n• Editor coordinating multi-writer coverage\n• Enforced AP Style + deadline rigor",
    },
    {
      id: "learning-advantage",
      label: "Content & Product\nOps Coordinator\n2019–2021",
      company: "Learning Advantage",
      nowrap: true,
      tip: "Content & Product Operations Coordinator\nFort Collins, CO\nOct 2019–Dec 2021\n• Built workflow automations boosting efficiency by 78%\n• Developed asset-sorting scripts cutting filing time by 90%\n• Streamlined product rollout workflows with sales/design",
    },
    {
      id: "primitive",
      label: "Head of Communications\n2022",
      company: "Primitive",
      tip: "Head of Communications\nRemote\nMar 2022–Dec 2022\n• Shaped GTM storytelling supporting a $9M fundraise\n• Increased media visibility by 100%\n• Coordinated launch ops contributing to 1.7M TVL",
    },
    {
      id: "consultant",
      label: "Founder & GTM Consultant\n2023–Now",
      company: "Self-employed",
      tip: "Founder & GTM Consultant\nSan Francisco, CA\nJan 2023–Present\n• Built GTM + operational systems for early-stage founders\n• Playbooks improved outreach efficiency by 66%\n• Reduced manual coordination by 35% across workflows",
    },
    {
      id: "live-laugh-colorado",
      label: "Marketing & Content\nOps Lead\n2024–2025",
      company: "Live.Laugh.Colorado. Real Estate Group",
      tip: "Marketing & Content\nOperations Lead\nDenver, CO\nSep 2024–Dec 2025\n• Standardized GTM processes across a $100M+ pipeline\n• Cross-functional initiatives doubled campaign delivery speed\n• Built Asana systems cutting turnaround time by 66%",
    },
    {
      id: "notion",
      label: "Certifications\n2025–2026",
      company: "Notion",
      tip: "Certifications\nDec 2025 & Jan 2026\n• Notion Certified Admin (Jan 2026)\n• Essentials, Workflows, Advanced (Dec 2025)",
    },
  ],
};

const toLines = (text = "") => text.split("\n").map((line) => line.trim()).filter(Boolean);

const getBullets = (tip) =>
  toLines(tip)
    .filter((line) => line.startsWith("•"))
    .map((line) => `• ${line.replace(/^•\s*/, "")}`);

// A role's label holds the title lines plus a year line; the company and year form the meta line.
const getRoleParts = (entry) => {
  const labelLines = toLines(entry.label);
  const yearLine = labelLines.find((line) => /\b(19|20)\d{2}\b/.test(line)) || "";
  return {
    roleText: labelLines.filter((line) => line !== yearLine).join(" "),
    metaLine: [entry.company, yearLine].filter(Boolean).join(" | "),
    bullets: getBullets(entry.tip),
  };
};

const buildRoleTip = (entry) => {
  const { roleText, metaLine, bullets } = getRoleParts(entry);
  return [roleText, metaLine, ...bullets].filter(Boolean).join("\n");
};

const toggleButtons = Array.from(document.querySelectorAll(".toggle-btn"));
const toolkitScroller = document.querySelector(".toolkit-scroller");
const toolkitCards = [];
let activeNodeIndex = 7;
let currentViewKey = "area";

const highlightNode = (index) => {
  activeNodeIndex = index;
  iconNodes.forEach((node, nodeIndex) => {
    node.classList.toggle("is-selected", nodeIndex === index);
  });
  toolkitCards.forEach((card, cardIndex) => {
    card.classList.toggle("is-active", cardIndex === index);
  });
};

const setActiveNode = (index, { scrollToolkit = false, animateRotation = false } = {}) => {
  if (!iconNodes.length) return;
  const total = iconNodes.length;
  highlightNode(((index % total) + total) % total);
  if (scrollToolkit && toolkitCards[activeNodeIndex]) {
    toolkitCards[activeNodeIndex].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
  const step = 360 / total;
  const targetRotation = -activeNodeIndex * step;
  if (animateRotation) {
    animateOrbitTo(targetRotation);
    return;
  }
  stopOrbitTween();
  orbitRotation = targetRotation;
  updateOrbit();
};

// Mobile cards mirror the orbit nodes: one card per node, created once and refilled per view.
if (toolkitScroller) {
  iconNodes.forEach((node, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "toolkit-card";
    card.innerHTML = '<span class="toolkit-title"></span><span class="toolkit-body"></span>';
    card.addEventListener("click", () => {
      setActiveNode(index, { scrollToolkit: true, animateRotation: window.innerWidth <= 900 });
    });
    toolkitScroller.appendChild(card);
    toolkitCards.push(card);
  });
}

const fillToolkitCard = (card, entry) => {
  card.dataset.view = currentViewKey;
  let title = entry.label.replace(/\s*\n\s*/g, " ");
  let body = getBullets(entry.tip).join("\n");
  if (currentViewKey === "role") {
    const { roleText, metaLine, bullets } = getRoleParts(entry);
    title = roleText;
    body = [metaLine, ...bullets].filter(Boolean).join("\n");
  }
  card.querySelector(".toolkit-title").textContent = title;
  card.querySelector(".toolkit-body").textContent = body;
};

const applyView = (viewKey) => {
  const data = viewData[viewKey];
  if (!data) return;
  currentViewKey = viewKey;
  iconNodes.forEach((node, index) => {
    const entry = data[index % data.length];
    node.querySelector(".icon-label").textContent = entry.label;
    node.setAttribute("data-tip", viewKey === "role" ? buildRoleTip(entry) : entry.tip);
    node.setAttribute("data-nowrap", entry.nowrap ? "true" : "false");
    if (toolkitCards[index]) fillToolkitCard(toolkitCards[index], entry);
  });
  setActiveNode(activeNodeIndex, { scrollToolkit: true });
};

const setActiveToggle = (viewKey) => {
  toggleButtons.forEach((btn) => {
    const isActive = btn.dataset.view === viewKey;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
  applyView(viewKey);
};

toggleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    playBubble();
    const view = btn.dataset.view;
    setActiveToggle(view);
  });
});

setActiveToggle("area");

iconNodes.forEach((node, index) => {
  node.addEventListener("click", () => {
    if (window.innerWidth > 900) return;
    setActiveNode(index, {
      scrollToolkit: true,
      animateRotation: true,
    });
  });
});

if (toolkitScroller) {
  let scrollFrame = null;
  toolkitScroller.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      if (!toolkitCards.length) return;
      const scrollerRect = toolkitScroller.getBoundingClientRect();
      const centerX = scrollerRect.left + scrollerRect.width / 2;
      let closestIndex = 0;
      let closestDist = Infinity;
      toolkitCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const dist = Math.abs(cardCenter - centerX);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = index;
        }
      });
      if (window.innerWidth <= 900) {
        // Rotate the orbit continuously with the scroll position rather than snapping per card.
        highlightNode(closestIndex);
        const firstCard = toolkitCards[0];
        if (firstCard) {
          const scrollerStyle = getComputedStyle(toolkitScroller);
          const gap = parseFloat(scrollerStyle.columnGap || scrollerStyle.gap || "0") || 0;
          const step = firstCard.getBoundingClientRect().width + gap;
          if (step > 0) {
            const rawIndex = toolkitScroller.scrollLeft / step;
            orbitRotation = -rawIndex * (360 / toolkitCards.length);
            updateOrbit();
          }
        }
        return;
      }
      setActiveNode(closestIndex);
    });
  });
}

const bubbleSound = typeof Audio !== "undefined" ? new Audio("assets/audio/bubble.wav") : null;
if (bubbleSound) {
  bubbleSound.volume = 0.4;
}

const playBubble = () => {
  if (!bubbleSound) return;
  bubbleSound.currentTime = 0;
  bubbleSound.play().catch(() => {});
};

// Corner panels. On desktop, Tech Stack and About expand in place (.is-open); on mobile, the
// corner buttons show one panel at a time (.is-mobile-open).
const mobileIcons = Array.from(document.querySelectorAll(".mobile-icon[data-target]"));
const mobilePanels = Array.from(document.querySelectorAll("[data-mobile-panel]"));
const collapsiblePanels = [
  [".tech-panel", ".tech-toggle", ".tech-grid"],
  [".about-panel", ".about-toggle", ".about-body"],
]
  .map(([panel, toggle, content]) => ({
    panel: document.querySelector(panel),
    toggle: document.querySelector(toggle),
    content: document.querySelector(content),
  }))
  .filter(({ panel, toggle, content }) => panel && toggle && content);

const isPanelOpen = (panel) =>
  panel.classList.contains("is-open") || panel.classList.contains("is-mobile-open");

// Single place that keeps ARIA state (and scroll reset) in step with the panel classes.
const syncPanelAria = () => {
  collapsiblePanels.forEach(({ panel, toggle, content }) => {
    const open = isPanelOpen(panel);
    toggle.setAttribute("aria-expanded", String(open));
    content.setAttribute("aria-hidden", String(!open));
    if (!open) panel.scrollTop = 0;
  });
  mobileIcons.forEach((icon) => {
    const panel = mobilePanels.find((item) => item.dataset.mobilePanel === icon.dataset.target);
    icon.setAttribute("aria-expanded", String(Boolean(panel?.classList.contains("is-mobile-open"))));
  });
};

const closeDesktopPanels = () => {
  collapsiblePanels.forEach(({ panel }) => panel.classList.remove("is-open"));
  syncPanelAria();
};

const closeMobilePanels = () => {
  mobilePanels.forEach((panel) => panel.classList.remove("is-mobile-open"));
  syncPanelAria();
};

collapsiblePanels.forEach(({ panel, toggle }) => {
  toggle.addEventListener("click", () => {
    playBubble();
    panel.classList.toggle("is-open");
    syncPanelAria();
  });
});

mobileIcons.forEach((icon) => {
  icon.addEventListener("click", () => {
    playBubble();
    const panel = mobilePanels.find((item) => item.dataset.mobilePanel === icon.dataset.target);
    if (!panel) return;
    const wasOpen = panel.classList.contains("is-mobile-open");
    closeMobilePanels();
    if (!wasOpen) panel.classList.add("is-mobile-open");
    syncPanelAria();
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) closeMobilePanels();
});
syncPanelAria();

// Clicks (taps fire click too) outside the panels close them; clicks inside leave them open.
document.addEventListener("click", (event) => {
  const target = event.target;
  if (window.innerWidth <= 900) {
    if (target.closest("[data-mobile-panel], .mobile-icon")) return;
    closeMobilePanels();
    return;
  }
  if (target.closest(".tech-panel, .about-panel")) return;
  closeDesktopPanels();
});

const projectModals = Array.from(document.querySelectorAll(".project-modal"));
const projectCloseButtons = Array.from(document.querySelectorAll(".project-close"));
const projectBackdrops = Array.from(document.querySelectorAll(".project-backdrop"));

const closeProject = () => {
  projectModals.forEach((modal) => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  });
  hideNodePopovers();
  stopGraph();
};

const openProject = (projectKey) => {
  const modal = projectModals.find((item) => item.dataset.project === projectKey);
  if (!modal) return;
  closeProject();
  closeMobilePanels();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  if (roadmap && modal.contains(roadmap)) startGraph();
};

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (projectModals.some((modal) => modal.classList.contains("is-open"))) {
    closeProject();
  }
});

const roadmapNodes = Array.from(document.querySelectorAll(".roadmap-node"));
const POPOVER_GAP = 12;
const VIEWPORT_MARGIN = 16;

const hideNodePopovers = () => {
  document.querySelectorAll(".node-popover.is-visible").forEach((popover) => {
    popover.classList.remove("is-visible");
  });
};

// Place the popover below or above its board, whichever has more room, and shrink the
// screenshots to fit that space so the popover never covers the board (or the cursor on it).
const positionPopover = (popover, anchor) => {
  const anchorRect = anchor.getBoundingClientRect();
  const spaceBelow = window.innerHeight - anchorRect.bottom - POPOVER_GAP - VIEWPORT_MARGIN;
  const spaceAbove = anchorRect.top - POPOVER_GAP - VIEWPORT_MARGIN;
  const placeBelow = spaceBelow >= spaceAbove;
  const available = Math.max(spaceBelow, spaceAbove);

  popover.style.removeProperty("--popover-img-max");
  const grid = popover.querySelector(".node-popover-grid");
  if (grid && popover.offsetHeight > available) {
    const textHeight = popover.offsetHeight - grid.offsetHeight;
    popover.style.setProperty("--popover-img-max", `${Math.max(60, available - textHeight)}px`);
  }

  const { width, height } = popover.getBoundingClientRect();
  const top = placeBelow ? anchorRect.bottom + POPOVER_GAP : anchorRect.top - POPOVER_GAP - height;
  const left = clamp(
    anchorRect.left + anchorRect.width / 2 - width / 2,
    VIEWPORT_MARGIN,
    window.innerWidth - width - VIEWPORT_MARGIN
  );
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
};

roadmapNodes.forEach((node) => {
  const anchor = node.querySelector(".main-node");
  const popover = node.querySelector(".node-popover");
  if (!anchor || !popover) return;

  // Fixed-position popovers live on <body> so the modal's scrolling pane can't clip them.
  document.body.appendChild(popover);

  // The popover is a non-interactive preview, so it never blocks hovering the other boards.
  const show = () => {
    hideNodePopovers();
    positionPopover(popover, anchor);
    popover.classList.add("is-visible");
  };
  const hide = () => popover.classList.remove("is-visible");

  node.addEventListener("mouseenter", show);
  node.addEventListener("mouseleave", hide);
  anchor.addEventListener("focus", show);
  anchor.addEventListener("blur", hide);
});

const roadmap = document.querySelector(".roadmap");
const roadmapLines = document.querySelector(".roadmap-lines");
const graphNodes = [];
const graphEdges = [];
const nodeByElement = new Map();
const dragState = { node: null, offsetX: 0, offsetY: 0 };

const createNode = (el, type, opts = {}) => {
  const node = {
    el,
    type,
    x: opts.x || 0,
    y: opts.y || 0,
    vx: 0,
    vy: 0,
    radius: type === "main" ? 42 : 24,
    fixed: false,
  };
  graphNodes.push(node);
  nodeByElement.set(el, node);
  return node;
};

const addEdge = (a, b, length, strength) => {
  graphEdges.push({ a, b, length, strength });
};

if (roadmap) {
  roadmap.classList.add("is-graph");
  const rect = roadmap.getBoundingClientRect();
  const centerX = rect.width / 2;
  const startY = 140;
  const stepY = 210;
  const xLeft = centerX - 90;
  const xRight = centerX + 180;
  const yLayout = [140, 220, 300, 380, 470, 550];

  roadmapNodes.forEach((node, index) => {
    const x = index % 2 === 0 ? xLeft : xRight;
    const y = yLayout[index] ?? startY + index * stepY;
    const main = createNode(node, "main", { x, y });
    main.fixed = true;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;

    const offshoots = Array.from(node.querySelectorAll(".offshoot-node"));
    const isLeft = x <= centerX;
    offshoots.forEach((offshoot, offIndex) => {
      offshoot.dataset.side = isLeft ? "left" : "right";
      roadmap.appendChild(offshoot);
      offshoot.classList.add("graph-node");
      const stackGap = 34;
      const stackHeight = (offshoots.length - 1) * stackGap;
      const oy = y - stackHeight / 2 + offIndex * stackGap;
      const offsetX = isLeft ? 520 : 320;
      const ox = isLeft ? x - offsetX : x + offsetX;
      const sub = createNode(offshoot, "sub", { x: ox, y: oy });
      sub.parent = main;
      sub.stackIndex = offIndex;
      sub.stackCount = offshoots.length;
      sub.stackGap = stackGap;
      sub.offsetX = offsetX;
      offshoot.style.left = `${ox}px`;
      offshoot.style.top = `${oy}px`;
      addEdge(main, sub, 120 + (offIndex % 2) * 20, 0.02);
    });
  });

  for (let i = 0; i < roadmapNodes.length - 1; i += 1) {
    const a = nodeByElement.get(roadmapNodes[i]);
    const b = nodeByElement.get(roadmapNodes[i + 1]);
    if (a && b) addEdge(a, b, 180, 0.01);
  }

  const maxY = graphNodes.reduce((max, node) => Math.max(max, node.y), 0);
  roadmap.style.minHeight = `${Math.max(520, maxY + 120)}px`;
}

let lineFrame = null;

const renderRoadmapLines = () => {
  if (!roadmap || !roadmapLines) return;
  if (lineFrame) return;
  lineFrame = requestAnimationFrame(() => {
    lineFrame = null;
    const rect = roadmap.getBoundingClientRect();
    // Lines connect the dots (numbered index on boards, sub-dot on offshoots), relative to the roadmap.
    const dotCenter = (el) => {
      const dot = el.querySelector(".node-index, .sub-dot") || el;
      const r = dot.getBoundingClientRect();
      return [r.left + r.width / 2 - rect.left, r.top + r.height / 2 - rect.top];
    };
    roadmapLines.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    roadmapLines.innerHTML = graphEdges
      .map(({ a, b }) => {
        const [x1, y1] = dotCenter(a.el);
        const [x2, y2] = dotCenter(b.el);
        const kind = a.type === "main" && b.type === "main" ? "main" : "offshoot";
        return `<line class="${kind}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
      })
      .join("");
  });
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const tickGraph = () => {
  if (!roadmap) return;
  const rect = roadmap.getBoundingClientRect();
  const centerX = rect.width / 2;

  for (let i = 0; i < graphNodes.length; i += 1) {
    for (let j = i + 1; j < graphNodes.length; j += 1) {
      const a = graphNodes[i];
      const b = graphNodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const minDist = a.radius + b.radius + 60;
      if (dist < minDist) {
        const force = (minDist - dist) * 0.015;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (!a.fixed) {
          a.vx -= fx;
          a.vy -= fy;
        }
        if (!b.fixed) {
          b.vx += fx;
          b.vy += fy;
        }
      }
    }
  }

  graphEdges.forEach((edge) => {
    const dx = edge.b.x - edge.a.x;
    const dy = edge.b.y - edge.a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const diff = dist - edge.length;
    const force = diff * edge.strength;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    if (!edge.a.fixed) {
      edge.a.vx += fx;
      edge.a.vy += fy;
    }
    if (!edge.b.fixed) {
      edge.b.vx -= fx;
      edge.b.vy -= fy;
    }
  });

  graphNodes.forEach((node) => {
    if (node.type === "main") {
      node.el.style.left = `${node.x}px`;
      node.el.style.top = `${node.y}px`;
      return;
    }
    if (node.fixed) return;
    const isLeft = node.parent.x <= centerX;
    node.el.dataset.side = isLeft ? "left" : "right";
    const stackHeight = (node.stackCount - 1) * node.stackGap;
    const targetY = node.parent.y - stackHeight / 2 + node.stackIndex * node.stackGap;
    const targetX = isLeft ? node.parent.x - node.offsetX : node.parent.x + node.offsetX;
    node.vx += (targetX - node.x) * 0.02;
    node.vy += (targetY - node.y) * 0.02;
    node.vx *= 0.88;
    node.vy *= 0.88;
    node.x += node.vx;
    node.y += node.vy;
    node.x = clamp(node.x, 60, rect.width - 60);
    node.y = clamp(node.y, 60, rect.height - 60);
    node.el.style.left = `${node.x}px`;
    node.el.style.top = `${node.y}px`;
  });

  renderRoadmapLines();
};

// The physics only runs while the roadmap's project modal is open (started/stopped by openProject/closeProject).
let graphFrame = null;

const startGraph = () => {
  if (!roadmap || graphFrame) return;
  const loop = () => {
    tickGraph();
    graphFrame = requestAnimationFrame(loop);
  };
  loop();
};

const stopGraph = () => {
  cancelAnimationFrame(graphFrame);
  graphFrame = null;
};

let glitchContext = null;
const playGlitch = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!glitchContext) glitchContext = new AudioCtx();
  const ctx = glitchContext;
  const now = ctx.currentTime;

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.connect(ctx.destination);

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 1800;
  noiseFilter.Q.value = 6;
  noise.connect(noiseFilter).connect(gain);

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.05);
  osc.connect(gain);

  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(2200, now);
  osc2.frequency.exponentialRampToValueAtTime(900, now + 0.04);
  osc2.connect(gain);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  noise.start(now);
  noise.stop(now + 0.06);
  osc.start(now);
  osc.stop(now + 0.07);
  osc2.start(now);
  osc2.stop(now + 0.06);
};

const bindDrag = (handle, nodeEl) => {
  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const graphNode = nodeByElement.get(nodeEl);
    if (!graphNode) return;
    const rect = roadmap.getBoundingClientRect();
    dragState.node = graphNode;
    dragState.offsetX = rect.left + graphNode.x - event.clientX;
    dragState.offsetY = rect.top + graphNode.y - event.clientY;
    graphNode.fixed = true;
    nodeEl.classList.add("is-dragging");
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragState.node) return;
    const rect = roadmap.getBoundingClientRect();
    dragState.node.x = event.clientX - rect.left + dragState.offsetX;
    dragState.node.y = event.clientY - rect.top + dragState.offsetY;
  });

  const endDrag = (event) => {
    if (!dragState.node) return;
    dragState.node.fixed = dragState.node.type === "main";
    nodeEl.classList.remove("is-dragging");
    handle.releasePointerCapture(event.pointerId);
    dragState.node = null;
  };

  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
};

roadmapNodes.forEach((node) => {
  const handle = node.querySelector(".main-node");
  if (handle) bindDrag(handle, node);
});

const subNodes = Array.from(document.querySelectorAll(".offshoot-node.graph-node"));
subNodes.forEach((sub) => {
  bindDrag(sub, sub);
});

const clickTargets = Array.from(document.querySelectorAll(".main-node, .offshoot-node"));
clickTargets.forEach((target) => {
  target.addEventListener("click", () => {
    playGlitch();
  });
});


document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".impact-link");
  if (!trigger) return;
  event.preventDefault();
  openProject(trigger.dataset.project);
});

projectCloseButtons.forEach((button) => {
  button.addEventListener("click", closeProject);
});

projectBackdrops.forEach((backdrop) => {
  backdrop.addEventListener("click", closeProject);
});
