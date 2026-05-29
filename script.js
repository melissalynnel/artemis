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

window.addEventListener(
  "touchmove",
  (event) => {
    if (window.innerWidth > 900) return;
    const scroller = event.target?.closest?.(".toolkit-scroller");
    if (scroller) return;
    event.preventDefault();
  },
  { passive: false }
);

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

  if (orbitRotation !== lastOrbitRotation) {
    lastOrbitRotation = orbitRotation;
    updateTooltipAnchors();
  }

  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);

const orbit = document.querySelector(".orbit");
const iconNodes = Array.from(document.querySelectorAll(".icon-node"));
let orbitRotation = 0;
let anchorFrame = null;
let lastOrbitRotation = orbitRotation;
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
    const dominantAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    const direction =
      dominantAxis === "x"
        ? dx >= 0
          ? "right"
          : "left"
        : dy >= 0
          ? "bottom"
          : "top";

    node.classList.toggle("tooltip-right", direction === "right");
    node.classList.toggle("tooltip-left", direction === "left");
    node.classList.toggle("tooltip-top", direction === "top");
    node.classList.toggle("tooltip-bottom", direction === "bottom");
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
    let y = centerY + Math.sin(angle) * radius;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.transform = "translate(-50%, -50%)";

    // Align the actual dot center to the computed ring center.
    if (dot) {
      const nodeRect = node.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      const nodeCenterX = nodeRect.left + nodeRect.width / 2;
      const nodeCenterY = nodeRect.top + nodeRect.height / 2;
      const dotCenterX = dotRect.left + dotRect.width / 2;
      const dotCenterY = dotRect.top + dotRect.height / 2;
      const dotOffsetX = dotCenterX - nodeCenterX;
      const dotOffsetY = dotCenterY - nodeCenterY;
      if (dotOffsetX !== 0) {
        node.style.left = `${x - dotOffsetX}px`;
      }
      if (dotOffsetY !== 0) {
        node.style.top = `${y - dotOffsetY}px`;
      }
    }
  });
  scheduleAnchorUpdate();
};

let isHoveringTechPanel = false;

const handleWheel = (event) => {
  if (window.innerWidth <= 900) return;
  if (isHoveringTechPanel) return;
  if (document.querySelector(".project-modal.is-open")) {
    return;
  }
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
      tip: "Head of Communications\nRemote\nMay 2022–Dec 2022\n• Shaped GTM storytelling supporting a $9M fundraise\n• Increased media visibility by 100%\n• Coordinated launch ops contributing to 1.7M TVL",
    },
    {
      id: "consultant",
      label: "Founder & GTM Consultant\n2023–Now",
      company: "Self-employed",
      tip: "Founder & GTM Consultant\nDenver, CO\nJan 2023–Present\n• Built GTM + operational systems for early-stage founders\n• Playbooks improved outreach efficiency by 66%\n• Reduced manual coordination by 35% across workflows",
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

const getRoleMetaFromLabel = (entry, fallbackLabel = "") => {
  const labelLines = (entry.label || fallbackLabel)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const yearLine = labelLines.find((line) => /\b(19|20)\d{2}\b/.test(line)) || "";
  const roleText = labelLines.filter((line) => line !== yearLine).join(" ");
  const metaLine = [entry.company || "", yearLine].filter(Boolean).join(" | ");
  return { roleText, metaLine };
};

const buildRoleTip = (entry, fallbackLabel = "") => {
  const { roleText, metaLine } = getRoleMetaFromLabel(entry, fallbackLabel);
  const bulletLines = (entry.tip || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("•"))
    .map((line) => line.replace(/^•\s*/, "").trim())
    .filter(Boolean)
    .map((line) => `• ${line}`);

  return [roleText, metaLine, ...bulletLines]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

const toggleButtons = Array.from(document.querySelectorAll(".toggle-btn"));
const mobileToolkit = document.querySelector(".mobile-toolkit");
const toolkitScroller = document.querySelector(".toolkit-scroller");
const toolkitCards = [];
let activeNodeIndex = 7;
let currentViewKey = "area";

const setActiveNode = (index, { scrollToolkit = false, animateRotation = false } = {}) => {
  if (!iconNodes.length) return;
  const total = iconNodes.length;
  activeNodeIndex = ((index % total) + total) % total;
  iconNodes.forEach((node, nodeIndex) => {
    node.classList.toggle("is-selected", nodeIndex === activeNodeIndex);
  });
  toolkitCards.forEach((card, cardIndex) => {
    card.classList.toggle("is-active", cardIndex === activeNodeIndex);
  });
  if (scrollToolkit && toolkitCards[activeNodeIndex]) {
    toolkitCards[activeNodeIndex].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
  if (mobileToolkit) {
    mobileToolkit.classList.add("is-active");
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

const syncToolkitCards = () => {
  if (!toolkitScroller) return;
  if (toolkitCards.length === 0) {
    toolkitScroller.innerHTML = "";
    iconNodes.forEach((node, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "toolkit-card";
      const title = document.createElement("span");
      title.className = "toolkit-title";
      const body = document.createElement("span");
      body.className = "toolkit-body";
      card.appendChild(title);
      card.appendChild(body);
      card.addEventListener("click", () => {
        setActiveNode(index, { scrollToolkit: true, animateRotation: window.innerWidth <= 900 });
      });
      toolkitScroller.appendChild(card);
      toolkitCards.push(card);
    });
  }

  const viewEntries = viewData[currentViewKey] || [];

  iconNodes.forEach((node, index) => {
    const label = node.querySelector(".icon-label")?.textContent || "";
    const tip = node.getAttribute("data-tip") || "";
    const entry = viewEntries[index % viewEntries.length] || {};
    const card = toolkitCards[index];
    if (!card) return;
    card.dataset.view = currentViewKey;
    if (entry.id) {
      card.dataset.role = entry.id;
    } else {
      delete card.dataset.role;
    }
    const title = card.querySelector(".toolkit-title");
    const body = card.querySelector(".toolkit-body");
    if (body) {
      const tipLines = tip.split("\n").map((line) => line.trim()).filter(Boolean);
      const bulletStart = tipLines.findIndex((line) => line.startsWith("•"));
      const bullets = bulletStart >= 0 ? tipLines.slice(bulletStart) : [];

      if (currentViewKey === "role") {
        const labelLines = (entry.label || label)
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const yearLine =
          labelLines.find((line) => /\b(19|20)\d{2}\b/.test(line)) || "";
        const roleLines = labelLines.filter((line) => line !== yearLine);
        const roleText = roleLines.join(" ");
        const metaLine = [entry.company || "", yearLine].filter(Boolean).join(" | ");
        const bulletLines = bullets
          .map((line) => line.replace(/^•\s*/, "").trim())
          .filter(Boolean)
          .map((line) => `• ${line}`);
        if (title) title.textContent = roleText || label.replace(/\s*\n\s*/g, " ");
        body.textContent = [metaLine, ...bulletLines]
          .filter(Boolean)
          .join("\n")
          .replace(/\n{2,}/g, "\n")
          .trim();
      } else {
        if (title) title.textContent = label.replace(/\s*\n\s*/g, " ");
        body.textContent = bullets
          .map((line) => line.replace(/^•\s*/, "").trim())
          .filter(Boolean)
          .map((line) => `• ${line}`)
          .join("\n")
          .replace(/\n{2,}/g, "\n")
          .trim();
      }
    }
  });

  setActiveNode(activeNodeIndex, { scrollToolkit: true });
};

const applyView = (viewKey) => {
  const data = viewData[viewKey];
  if (!data) return;
  iconNodes.forEach((node, index) => {
    const entry = data[index % data.length];
    const label = node.querySelector(".icon-label");
    if (label) label.textContent = entry.label;
    const tip = viewKey === "role" ? buildRoleTip(entry, entry.label) : entry.tip;
    node.setAttribute("data-tip", tip);
    node.setAttribute("data-nowrap", entry.nowrap ? "true" : "false");
  });
  syncToolkitCards();
};

const setActiveToggle = (viewKey) => {
  currentViewKey = viewKey;
  toggleButtons.forEach((btn) => {
    const isActive = btn.dataset.view === viewKey;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
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
        activeNodeIndex = closestIndex;
        iconNodes.forEach((node, nodeIndex) => {
          node.classList.toggle("is-selected", nodeIndex === activeNodeIndex);
        });
        toolkitCards.forEach((card, cardIndex) => {
          card.classList.toggle("is-active", cardIndex === activeNodeIndex);
        });

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

const techPanel = document.querySelector(".tech-panel");
const techToggle = document.querySelector(".tech-toggle");
const techGrid = document.querySelector(".tech-grid");
const projectsPanel = document.querySelector(".projects-panel");
const projectsToggle = document.querySelector(".projects-toggle");
const projectsGrid = document.querySelector(".projects-grid");
const mobileIcons = Array.from(document.querySelectorAll(".mobile-icon"));
const mobilePanels = Array.from(document.querySelectorAll("[data-mobile-panel]"));
const bubbleSound = typeof Audio !== "undefined" ? new Audio("assets/audio/bubble.wav") : null;
if (bubbleSound) {
  bubbleSound.volume = 0.4;
}
let isTouchScrolling = false;
let scrollResetTimer = null;

const playBubble = () => {
  if (!bubbleSound) return;
  bubbleSound.currentTime = 0;
  bubbleSound.play().catch(() => {});
};

const triggerBob = (el) => {
  if (!el) return;
  el.classList.remove("is-bob");
  void el.offsetWidth;
  el.classList.add("is-bob");
};

if (techPanel && techToggle) {
  techToggle.addEventListener("click", () => {
    playBubble();
    const isOpen = techPanel.classList.toggle("is-open");
    techPanel.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (techGrid) {
      techGrid.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }
    if (!isOpen) {
      techPanel.scrollTop = 0;
    }
  });

  techPanel.addEventListener("mouseenter", () => {
    isHoveringTechPanel = true;
    techPanel.classList.add("is-hovering");
  });

  techPanel.addEventListener("mouseleave", () => {
    isHoveringTechPanel = false;
    techPanel.classList.remove("is-hovering");
  });
}

if (projectsPanel && projectsToggle) {
  projectsToggle.addEventListener("click", () => {
    playBubble();
    const isOpen = projectsPanel.classList.toggle("is-open");
    projectsPanel.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (projectsGrid) {
      projectsGrid.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }
  });
}

const closeDesktopPanels = () => {
  if (techPanel) {
    techPanel.classList.remove("is-open");
    techPanel.setAttribute("aria-expanded", "false");
    techPanel.scrollTop = 0;
  }
  if (techGrid) {
    techGrid.setAttribute("aria-hidden", "true");
  }
  if (projectsPanel) {
    projectsPanel.classList.remove("is-open");
    projectsPanel.setAttribute("aria-expanded", "false");
  }
  if (projectsGrid) {
    projectsGrid.setAttribute("aria-hidden", "true");
  }
};

const closeMobilePanels = () => {
  mobilePanels.forEach((panel) => {
    panel.classList.remove("is-mobile-open");
  });
  if (techPanel) {
    techPanel.setAttribute("aria-expanded", "false");
    techPanel.scrollTop = 0;
  }
  if (techGrid) {
    techGrid.setAttribute("aria-hidden", "true");
  }
  if (projectsPanel) {
    projectsPanel.setAttribute("aria-expanded", "false");
  }
  if (projectsGrid) {
    projectsGrid.setAttribute("aria-hidden", "true");
  }
};

const closeToolkit = () => {
  if (mobileToolkit) {
    mobileToolkit.classList.add("is-active");
  }
};

const syncPanelsForViewport = () => {
  if (window.innerWidth > 900) {
    closeMobilePanels();
  }
};

window.addEventListener("resize", syncPanelsForViewport);
syncPanelsForViewport();

const markScrolling = () => {
  isTouchScrolling = true;
  if (scrollResetTimer) {
    clearTimeout(scrollResetTimer);
  }
  scrollResetTimer = setTimeout(() => {
    isTouchScrolling = false;
  }, 160);
};

mobileIcons.forEach((icon) => {
  icon.addEventListener("click", () => {
    playBubble();
    triggerBob(icon);
    const target = icon.dataset.target;
    if (!target) return;
    const panel = mobilePanels.find((item) => item.dataset.mobilePanel === target);
    if (!panel) return;
    const isOpen = panel.classList.contains("is-mobile-open");
    closeMobilePanels();
    if (!isOpen) {
      panel.classList.add("is-mobile-open");
      if (target === "tech" && techPanel) {
        techPanel.setAttribute("aria-expanded", "true");
        if (techGrid) {
          techGrid.setAttribute("aria-hidden", "false");
        }
      }
      if (target === "projects" && projectsPanel) {
        projectsPanel.setAttribute("aria-expanded", "true");
        if (projectsGrid) {
          projectsGrid.setAttribute("aria-hidden", "false");
        }
      }
    }
  });
});

mobilePanels.forEach((panel) => {
  panel.addEventListener("touchmove", markScrolling, { passive: true });
  panel.addEventListener("touchend", markScrolling, { passive: true });
});

if (mobileToolkit) {
  mobileToolkit.addEventListener("touchmove", markScrolling, { passive: true });
  mobileToolkit.addEventListener("touchend", markScrolling, { passive: true });
}

if (toolkitScroller) {
  toolkitScroller.addEventListener("touchmove", markScrolling, { passive: true });
  toolkitScroller.addEventListener("touchend", markScrolling, { passive: true });
}

const handleOutsideClose = (event) => {
  if (window.innerWidth > 900) return;
  if (isTouchScrolling) return;
  const target = event.target;
  if (target.closest(".mobile-icon")) return;
  closeMobilePanels();
  closeToolkit();
};

document.addEventListener("click", handleOutsideClose);
document.addEventListener("touchend", handleOutsideClose);

const handleDesktopPanelClose = (event) => {
  if (window.innerWidth <= 900) return;
  const target = event.target;
  if (target.closest(".tech-panel")) return;
  if (target.closest(".projects-panel")) return;
  if (target.closest(".tech-toggle")) return;
  if (target.closest(".projects-toggle")) return;
  closeDesktopPanels();
};

document.addEventListener("click", handleDesktopPanelClose);

const techLogos = Array.from(document.querySelectorAll(".tech-item img"));

const makeInitials = (text) => {
  if (!text) return "★";
  const cleaned = text.replace(/logo/i, "").trim();
  if (cleaned.includes("+")) {
    const parts = cleaned.split("+").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] || ""}+${parts[1][0] || ""}`.toUpperCase();
    }
  }
  const ignore = new Set(["and", "of", "the", "suite", "business", "ads", "pro", "com"]);
  const words = cleaned.replace(/[^a-z0-9 ]/gi, " ").trim().split(/\s+/);
  const filtered = words.filter((word) => word && !ignore.has(word.toLowerCase()));
  const target = filtered.length ? filtered : words;
  if (target.length === 0) return "★";
  if (target.length === 1) return target[0].slice(0, 2).toUpperCase();
  return `${target[0][0]}${target[1][0]}`.toUpperCase();
};

const createFallbackSvg = (label) => {
  const initials = makeInitials(label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff8bd7"/>
      <stop offset="100%" stop-color="#7b6dff"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="\"Avenir Next\", \"Helvetica Neue\", Arial, sans-serif" font-size="22" fill="white" letter-spacing="1">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

techLogos.forEach((logo) => {
  logo.referrerPolicy = "no-referrer";
  const label =
    logo.alt ||
    logo.closest(".tech-item")?.querySelector("span")?.textContent ||
    "";
  const handleError = () => {
    if (logo.dataset.fallbackApplied) return;
    logo.dataset.fallbackApplied = "true";
    logo.src = createFallbackSvg(label);
  };
  logo.addEventListener("error", handleError);
});

const projectModals = Array.from(document.querySelectorAll(".project-modal"));
const projectCloseButtons = Array.from(document.querySelectorAll(".project-close"));
const projectBackdrops = Array.from(document.querySelectorAll(".project-backdrop"));
const projectTriggers = Array.from(document.querySelectorAll(".impact-link"));
const projectWidgets = Array.from(document.querySelectorAll(".projects-item[data-project]"));

const closeProject = () => {
  projectModals.forEach((modal) => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  });
};

const openProject = (projectKey, controlId) => {
  let modal = null;
  if (projectKey) {
    modal = projectModals.find((item) => item.dataset.project === projectKey) || null;
  }
  if (!modal && controlId) {
    modal = document.getElementById(controlId);
  }
  if (!modal && projectModals.length) {
    modal = projectModals[0];
  }
  if (!modal) return;
  closeProject();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
};

window.openProjectModal = openProject;

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (projectModals.some((modal) => modal.classList.contains("is-open"))) {
    closeProject();
  }
});

const roadmapNodes = Array.from(document.querySelectorAll(".roadmap-node"));
const nodePopovers = new WeakMap();
roadmapNodes.forEach((node) => {
  const popover = node.querySelector(".node-popover");
  if (popover) {
    nodePopovers.set(node, popover);
  }

  const button = node.querySelector(".main-node");
  if (button) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const isExpanded = node.classList.contains("is-expanded");
      roadmapNodes.forEach((item) => {
        item.classList.remove("is-expanded");
        const itemPopover = nodePopovers.get(item);
        if (itemPopover) {
          itemPopover.classList.remove("is-expanded");
        }
      });
      if (!isExpanded) {
        node.classList.add("is-expanded");
        const activePopover = nodePopovers.get(node);
        if (activePopover) {
          const rect = node.getBoundingClientRect();
          activePopover.style.left = `${rect.left + rect.width / 2}px`;
          activePopover.style.top = `${rect.top + rect.height + 12}px`;
          activePopover.classList.add("is-expanded");
          activePopover.classList.add("is-visible");
        }
      }
    });
  }

  const close = node.querySelector(".node-popover-close");
  if (close) {
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      node.classList.remove("is-expanded");
      const activePopover = nodePopovers.get(node);
      if (activePopover) {
        activePopover.classList.remove("is-expanded");
        activePopover.classList.remove("is-visible");
      }
    });
  }

  if (popover) {
    if (!popover.dataset.portal) {
      popover.dataset.portal = "true";
      document.body.appendChild(popover);
    }

    let overNode = false;
    let overPopover = false;

    const position = () => {
      const rect = node.getBoundingClientRect();
      popover.style.left = `${rect.left + rect.width / 2}px`;
      popover.style.top = `${rect.top + rect.height + 12}px`;
    };

    const show = () => {
      position();
      popover.classList.add("is-visible");
      if (node.classList.contains("is-expanded")) {
        popover.classList.add("is-expanded");
      } else {
        popover.classList.remove("is-expanded");
      }
    };

    const hide = () => {
      if (node.classList.contains("is-expanded") || overNode || overPopover) {
        return;
      }
      popover.classList.remove("is-visible");
    };

    node.addEventListener("mouseenter", () => {
      overNode = true;
      show();
    });
    node.addEventListener("mouseleave", () => {
      overNode = false;
      hide();
    });
    popover.addEventListener("mouseenter", () => {
      overPopover = true;
      show();
    });
    popover.addEventListener("mouseleave", () => {
      overPopover = false;
      hide();
    });
  }
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
    baseX: opts.x || 0,
    baseY: opts.y || 0,
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
  const totalHeight = startY + (roadmapNodes.length - 1) * stepY + 200;
  roadmap.style.minHeight = `${totalHeight}px`;
  const xLeft = centerX - 90;
  const xRight = centerX + 180;
  const yLayout = [140, 220, 300, 380, 470, 550];

  roadmapNodes.forEach((node, index) => {
    const x = index % 2 === 0 ? xLeft : xRight;
    const y = yLayout[index] ?? startY + index * stepY;
    const main = createNode(node, "main", { x, y });
    main.baseX = x;
    main.baseY = y;
    main.fixed = true;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;

    const offshoots = Array.from(node.querySelectorAll(".offshoot-node"));
    const isLeft = x <= centerX;
    offshoots.forEach((offshoot, offIndex) => {
      if (!offshoot.dataset.parent) {
        offshoot.dataset.parent = node.dataset.node || `node-${index + 1}`;
      }
      offshoot.dataset.side = isLeft ? "left" : "right";
      roadmap.appendChild(offshoot);
      offshoot.classList.add("graph-node");
      const stackGap = 34;
      const stackHeight = (offshoots.length - 1) * stackGap;
      const jitterX = 0;
      const jitterY = 0;
      const oy = y - stackHeight / 2 + offIndex * stackGap + jitterY;
      const offsetX = isLeft ? 520 : 320;
      const ox = isLeft ? x - offsetX + jitterX : x + offsetX + jitterX;
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

let activeDrag = null;
let lineFrame = null;

const renderRoadmapLines = () => {
  if (!roadmap || !roadmapLines) return;
  if (lineFrame) return;
  lineFrame = requestAnimationFrame(() => {
    lineFrame = null;
    const rect = roadmap.getBoundingClientRect();
    const lines = [];
    graphEdges.forEach((edge) => {
      const aRect = edge.a.el.getBoundingClientRect();
      const bRect = edge.b.el.getBoundingClientRect();
      const kind = edge.a.type === "main" && edge.b.type === "main" ? "main" : "offshoot";
      const aDot = edge.a.el.querySelector(".node-index");
      const bDot = edge.b.el.querySelector(".node-index");
      const aDotRect = aDot ? aDot.getBoundingClientRect() : aRect;
      const bDotRect = bDot ? bDot.getBoundingClientRect() : bRect;

      const x1 = aDotRect.left + aDotRect.width / 2 - rect.left;
      const y1 = aDotRect.top + aDotRect.height / 2 - rect.top;
      const subSide = edge.b.el.dataset.side;
      const subDot = edge.b.el.querySelector(".sub-dot");
      const subDotRect = subDot ? subDot.getBoundingClientRect() : bRect;
      const x2 =
        edge.b.type === "sub"
          ? subDotRect.left + subDotRect.width / 2 - rect.left
          : bDotRect.left + bDotRect.width / 2 - rect.left;
      const y2 =
        edge.b.type === "sub"
          ? subDotRect.top + subDotRect.height / 2 - rect.top
          : bDotRect.top + bDotRect.height / 2 - rect.top;

      lines.push({ x1, y1, x2, y2, kind });
    });
    roadmapLines.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    roadmapLines.innerHTML = lines
      .map((line) => `<line class="${line.kind}" x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" />`)
      .join("");
  });
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const tickGraph = () => {
  if (!roadmap) return;
  const rect = roadmap.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

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
      if (node.fixed) {
        node.el.style.left = `${node.x}px`;
        node.el.style.top = `${node.y}px`;
        return;
      }
      node.x += (node.baseX - node.x) * 0.2;
      node.y += (node.baseY - node.y) * 0.2;
      node.vx *= 0.5;
      node.vy *= 0.5;
      node.el.style.left = `${node.x}px`;
      node.el.style.top = `${node.y}px`;
      return;
    }
    if (node.fixed) return;
    if (node.type === "sub" && node.parent) {
      const isLeft = node.parent.x <= centerX;
      node.el.dataset.side = isLeft ? "left" : "right";
      const stackHeight = (node.stackCount - 1) * node.stackGap;
      const targetY = node.parent.y - stackHeight / 2 + node.stackIndex * node.stackGap;
      const targetX = isLeft ? node.parent.x - node.offsetX : node.parent.x + node.offsetX;
      node.vx += (targetX - node.x) * 0.02;
      node.vy += (targetY - node.y) * 0.02;
    } else {
      const cx = (centerX - node.x) * 0.0008;
      const cy = (centerY - node.y) * 0.0008;
      node.vx += cx;
      node.vy += cy;
    }
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
  requestAnimationFrame(tickGraph);
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

  handle.addEventListener("pointerup", (event) => {
    if (!dragState.node) return;
    if (dragState.node.type === "main") {
      dragState.node.fixed = true;
      dragState.node.baseX = dragState.node.x;
      dragState.node.baseY = dragState.node.y;
    } else {
      dragState.node.fixed = false;
    }
    nodeEl.classList.remove("is-dragging");
    handle.releasePointerCapture(event.pointerId);
    dragState.node = null;
  });

  handle.addEventListener("pointercancel", (event) => {
    if (!dragState.node) return;
    if (dragState.node.type === "main") {
      dragState.node.fixed = true;
      dragState.node.baseX = dragState.node.x;
      dragState.node.baseY = dragState.node.y;
    } else {
      dragState.node.fixed = false;
    }
    nodeEl.classList.remove("is-dragging");
    handle.releasePointerCapture(event.pointerId);
    dragState.node = null;
  });
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

window.addEventListener("resize", renderRoadmapLines);
window.addEventListener("scroll", renderRoadmapLines, { passive: true });
renderRoadmapLines();
if (roadmap) {
  tickGraph();
}

projectTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openProject(trigger.dataset.project, trigger.getAttribute("aria-controls"));
  });
});

projectWidgets.forEach((widget) => {
  widget.addEventListener("click", () => {
    openProject(widget.dataset.project);
  });
});

document.addEventListener("click", (event) => {
  const impactTrigger = event.target.closest(".impact-link");
  if (impactTrigger) {
    event.preventDefault();
    openProject(impactTrigger.dataset.project, impactTrigger.getAttribute("aria-controls"));
    return;
  }
  const widgetTrigger = event.target.closest(".projects-item[data-project]");
  if (widgetTrigger) {
    event.preventDefault();
    openProject(widgetTrigger.dataset.project, widgetTrigger.getAttribute("aria-controls"));
  }
});

projectCloseButtons.forEach((button) => {
  button.addEventListener("click", closeProject);
});

projectBackdrops.forEach((backdrop) => {
  backdrop.addEventListener("click", closeProject);
});
