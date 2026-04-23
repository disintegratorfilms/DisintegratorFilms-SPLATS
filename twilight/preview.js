const DEFAULT_PRESENTATION = {
  aimX: 0,
  aimY: 0,
  dolly: 0,
  fovTrim: 0,
};
const DEFAULT_CAPTION_CAMERA = {
  x: 1.2,
  y: 0.2,
  depth: 3,
  scale: 0.6,
};
const MOBILE_BREAKPOINT = 640;
const WHEEL_THRESHOLD = 70;
const SWIPE_THRESHOLD = 42;
const TRANSITION_SLOWDOWN = 2.3;
const AUDIO_CROSSFADE_SECONDS = 4.8;
const viewerFrame = document.querySelector("#viewer-frame");
const statusPill = document.querySelector("#status-pill");
const progressBar = document.querySelector("#progress-bar");
const scrollTrack = document.querySelector("#scroll-track");
const spacerTemplate = document.querySelector("#scroll-spacer-template");
const siteMarkEyebrow = document.querySelector("#site-mark-eyebrow");
const siteMarkBrand = document.querySelector("#site-mark-brand");
const siteMarkLogo = document.querySelector("#site-mark-logo");
const siteMarkTitle = document.querySelector("#site-mark-title");
const siteMarkPerson = document.querySelector("#site-mark-person");
const siteMarkBody = document.querySelector("#site-mark-body");
const siteLinks = document.querySelector("#site-links");
const infoPanel = document.querySelector("#info-panel");
const infoEyebrow = document.querySelector("#info-eyebrow");
const infoTitle = document.querySelector("#info-title");
const infoBody = document.querySelector("#info-body");
const mobileInfoToggle = document.querySelector("#mobile-info-toggle");

const project = normalizeProject(await loadProjectData());
const audioManager = createCrossfadeAudioLoop(
  project.audio.enabled ? project.audio.src : "",
  project.audio.volume ?? 0.34
);

let bridge = null;
let states = project.states;
let sections = [];
let renderHandle = 0;
let activeIndex = 0;
let settledIndex = 0;
let currentBaseView = null;
let transitionState = null;
let wheelIntent = 0;
let touchStartY = null;
let mobileInfoOpen = false;

applyProjectChrome();
document.body.classList.toggle("is-mobile-preview", isMobileViewport());
window.addEventListener("message", handleBridgeMessage);
configureViewerSource();
renderSpacers();
connectToViewer();
bindNavigation();

function configureViewerSource() {
  const frameUrl = new URL(project.viewer.html, window.location.href);
  if (project.viewer.content) {
    frameUrl.searchParams.set("content", project.viewer.content);
  }
  if (project.viewer.rev) {
    frameUrl.searchParams.set("rev", project.viewer.rev);
  }
  viewerFrame.src = frameUrl.toString();
}

function applyProjectChrome() {
  document.title = project.site.title || "SplatSite Preview";
  const hasLogo = Boolean(project.site.logoSrc);
  siteMarkBrand.hidden = !hasLogo;
  if (hasLogo) {
    siteMarkLogo.src = project.site.logoSrc;
  } else {
    siteMarkLogo.removeAttribute("src");
  }
  siteMarkEyebrow.textContent = project.site.eyebrow ?? "";
  siteMarkTitle.textContent = project.site.title ?? "";
  siteMarkPerson.textContent = project.site.person ?? "";
  siteMarkBody.textContent = project.site.body ?? "";
  siteLinks.innerHTML = "";

  (project.site.links ?? []).forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.textContent = link.label;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    siteLinks.append(anchor);
  });

  const root = document.documentElement;
  root.style.setProperty("--font-display", project.theme.displayFont);
  root.style.setProperty("--font-body", project.theme.bodyFont);
  root.style.setProperty("--font-heading", project.theme.bodyFont);
  root.style.setProperty("--font-detail", project.theme.detailFont);
  root.style.setProperty("--accent", project.theme.accent);
  root.style.setProperty("--accent-soft", project.theme.accentSoft);
  root.style.setProperty("--panel-background", project.theme.panelBackground);
  root.style.setProperty(
    "--overlay-haze-opacity",
    String(clamp((project.effects.overlayHaze ?? 0.18) * 0.42, 0, 1))
  );
  root.style.setProperty(
    "--overlay-haze-blur",
    `${28 + (project.effects.lensSmudge ?? 0.18) * 24}px`
  );
  root.style.setProperty(
    "--grain-opacity",
    String(clamp((project.effects.grain ?? 0.11) * 0.26, 0, 0.95))
  );
}

function renderSpacers() {
  scrollTrack.innerHTML = "";

  states.forEach(() => {
    const fragment = spacerTemplate.content.cloneNode(true);
    scrollTrack.append(fragment);
  });

  sections = Array.from(document.querySelectorAll(".scroll-spacer"));
}

function connectToViewer() {
  const maxAttempts = 200;
  let attempts = 0;

  const connect = () => {
    attempts += 1;

    try {
      const candidate = viewerFrame.contentWindow?.sse?.bridge;

      if (candidate && typeof candidate.setCurrentView === "function") {
        initializeBridge(candidate);
        return;
      }
    } catch (error) {
      console.warn("Viewer bridge connection attempt failed.", error);
    }

    if (attempts < maxAttempts) {
      window.setTimeout(connect, 150);
    } else {
      setStatus(
        "warn",
        "Could not reach the viewer bridge. Reload after the embedded SuperSplat viewer finishes loading."
      );
    }
  };

  viewerFrame.addEventListener("load", () => {
    setStatus("warn", "Viewer loaded. Waiting for the camera bridge...");
    connect();
  });
}

function handleBridgeMessage(event) {
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data?.source !== "supersplat-viewer" || event.data?.type !== "bridge-ready") {
    return;
  }

  try {
    const candidate = viewerFrame.contentWindow?.sse?.bridge;
    if (candidate && typeof candidate.setCurrentView === "function") {
      initializeBridge(candidate);
    }
  } catch (error) {
    console.warn("Bridge-ready message received, but bridge lookup failed.", error);
  }
}

function initializeBridge(candidate) {
  bridge = candidate;
  audioManager.ensureStarted();
  bridge.setAtmosphereSettings?.(project.effects);

  const initialIndex = 0;
  activeIndex = initialIndex;
  settledIndex = initialIndex;
  currentBaseView = getPresentedView(states[initialIndex]);
  transitionState = null;

  if (currentBaseView) {
    bridge.setCurrentView(applyHandheld(currentBaseView, performance.now(), states[initialIndex]));
    updateUi(initialIndex, getOverallProgress());
  }

  syncSectionPosition(initialIndex, "auto");
  setStatus("ready", "Sequence ready. Use the wheel, trackpad, or arrow keys to move scene to scene.");
  startRenderLoop();
}

function bindNavigation() {
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", handleResize);
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchend", handleTouchEnd, { passive: false });
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  mobileInfoToggle.addEventListener("click", () => {
    mobileInfoOpen = !mobileInfoOpen;
    document.body.classList.toggle("mobile-info-open", mobileInfoOpen);
  });
}

function handleResize() {
  sections = Array.from(document.querySelectorAll(".scroll-spacer"));
  document.body.classList.toggle("is-mobile-preview", isMobileViewport());
  if (!isMobileViewport()) {
    mobileInfoOpen = false;
    document.body.classList.remove("mobile-info-open");
  }
  if (currentBaseView) {
    currentBaseView = getPresentedView(states[settledIndex]);
  }
  updateUi(settledIndex, getOverallProgress());
  syncSectionPosition(settledIndex, "auto");
}

function handleWheel(event) {
  if (!states.length) {
    return;
  }

  unlockAudio();
  event.preventDefault();

  if (transitionState) {
    return;
  }

  if (Math.sign(event.deltaY) !== Math.sign(wheelIntent)) {
    wheelIntent = 0;
  }

  wheelIntent += event.deltaY;

  if (Math.abs(wheelIntent) < WHEEL_THRESHOLD) {
    return;
  }

  const direction = wheelIntent > 0 ? 1 : -1;
  wheelIntent = 0;
  navigateBy(direction);
}

function handleKeydown(event) {
  unlockAudio();
  if (transitionState || !states.length) {
    return;
  }
  if (["ArrowDown", "PageDown", " ", "Spacebar"].includes(event.key)) {
    event.preventDefault();
    navigateBy(1);
  }

  if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    navigateBy(-1);
  }
}

function handleTouchStart(event) {
  unlockAudio();
  touchStartY = event.changedTouches?.[0]?.clientY ?? null;
}

function handleTouchEnd(event) {
  if (touchStartY === null || transitionState || !states.length) {
    touchStartY = null;
    return;
  }

  const touchEndY = event.changedTouches?.[0]?.clientY ?? touchStartY;
  const deltaY = touchStartY - touchEndY;
  touchStartY = null;

  if (Math.abs(deltaY) < SWIPE_THRESHOLD) {
    return;
  }

  event.preventDefault();
  navigateBy(deltaY > 0 ? 1 : -1);
}

function navigateBy(direction) {
  navigateToIndex(clamp(settledIndex + direction, 0, states.length - 1));
}

function navigateToIndex(nextIndex) {
  if (nextIndex === settledIndex || nextIndex === activeIndex) {
    return;
  }

  activeIndex = nextIndex;
  syncSectionPosition(nextIndex);
  startTransitionTo(nextIndex);
}

function syncSectionPosition(index, behavior = "smooth") {
  const section = sections[index];
  if (!section) {
    return;
  }

  window.scrollTo({
    top: section.offsetTop,
    behavior,
  });
}

function startTransitionTo(nextIndex) {
  const nextView = getPresentedView(states[nextIndex]);
  if (!nextView) {
    return;
  }

  const now = performance.now();
  const fromIndex = transitionState ? transitionState.toIndex : settledIndex;
  const fromView = transitionState ? getTransitionView(now) : currentBaseView ?? getPresentedView(states[fromIndex]);
  const turnFactor = computeTurnFactor(fromView, nextView);
  const baseDuration = (states[nextIndex]?.transition?.duration ?? 1.8) * 1000;

  transitionState = {
    fromIndex,
    toIndex: nextIndex,
    from: cloneView(fromView),
    to: cloneView(nextView),
    easing: states[nextIndex]?.transition?.easing ?? "easeInOutCubic",
    durationMs: Math.max(
      baseDuration * TRANSITION_SLOWDOWN * (1 + turnFactor * 1.75),
      3200
    ),
    startTime: now,
  };
}

function startRenderLoop() {
  if (renderHandle) {
    return;
  }

  const frame = (time) => {
    renderHandle = window.requestAnimationFrame(frame);

    if (!bridge || !states.length) {
      return;
    }

    audioManager.update();

    let baseView = currentBaseView ?? getPresentedView(states[settledIndex]);
    let displayIndex = settledIndex;
    let progressValue = getOverallProgress();

    if (transitionState) {
      const rawProgress = clamp(
        (time - transitionState.startTime) / Math.max(transitionState.durationMs, 1),
        0,
        1
      );
      const moveProgress = softenProgress(applyEasing(rawProgress, transitionState.easing));
      const lookProgress = applyLookEasing(rawProgress);

      baseView = interpolateView(
        transitionState.from,
        transitionState.to,
        moveProgress,
        lookProgress
      );
      currentBaseView = cloneView(baseView);
      displayIndex = transitionState.toIndex;
      progressValue = getOverallProgress(moveProgress);

      if (rawProgress >= 1) {
        settledIndex = transitionState.toIndex;
        activeIndex = settledIndex;
        baseView = cloneView(transitionState.to);
        currentBaseView = cloneView(baseView);
        transitionState = null;
        progressValue = getOverallProgress();
      }
    } else {
      currentBaseView = cloneView(baseView);
      displayIndex = settledIndex;
      progressValue = getOverallProgress();
    }

    const motionState = states[displayIndex] ?? states[settledIndex] ?? states[0];
    const handheldView = applyHandheld(baseView, time, motionState);

    bridge.setCurrentView(handheldView);
    updateUi(displayIndex, progressValue);
    updateSceneCaption(time);
  };

  renderHandle = window.requestAnimationFrame(frame);
}

function getTransitionView(now) {
  if (!transitionState) {
    return currentBaseView ?? getPresentedView(states[settledIndex]);
  }

  const rawProgress = clamp(
    (now - transitionState.startTime) / Math.max(transitionState.durationMs, 1),
    0,
    1
  );
  const moveProgress = softenProgress(applyEasing(rawProgress, transitionState.easing));
  const lookProgress = applyLookEasing(rawProgress);
  return interpolateView(transitionState.from, transitionState.to, moveProgress, lookProgress);
}

function getOverallProgress(interpolation = null) {
  if (states.length <= 1) {
    return 1;
  }

  if (!transitionState || interpolation === null) {
    return settledIndex / (states.length - 1);
  }

  const blendedIndex =
    transitionState.fromIndex +
    (transitionState.toIndex - transitionState.fromIndex) * clamp(interpolation, 0, 1);

  return blendedIndex / (states.length - 1);
}

function updateUi(activeStateIndex, overallProgress) {
  progressBar.style.width = `${clamp(overallProgress, 0, 1) * 100}%`;
  const state = states[activeStateIndex] ?? states[0];
  if (state) {
    const showInfoPanel = state.showInfoPanel !== false;
    const mobile = isMobileViewport();
    const panelVisible = showInfoPanel && (!mobile || mobileInfoOpen);
    infoPanel.style.opacity = panelVisible ? "1" : "0";
    infoPanel.style.transform = panelVisible ? "translateY(0)" : (mobile ? "translateY(calc(100% + 1rem))" : "translateY(14px)");
    infoEyebrow.textContent = showInfoPanel ? (state.eyebrow ?? state.label ?? "") : "";
    infoTitle.textContent = showInfoPanel ? (state.infoTitle ?? state.title ?? state.label ?? "") : "";
    infoBody.textContent = showInfoPanel ? (state.infoBody ?? "") : "";
    mobileInfoToggle.classList.toggle("is-visible", mobile && showInfoPanel);
    if (!showInfoPanel) {
      mobileInfoOpen = false;
      document.body.classList.remove("mobile-info-open");
    }
  }
}

function unlockAudio() {
  audioManager.ensureStarted();
}

function updateSceneCaption(time) {
  if (!bridge || !states.length) {
    bridge.setSceneCaption?.({ opacity: 0 });
    return;
  }

  let captionIndex = settledIndex;
  let opacity = 1;

  if (transitionState) {
    const rawProgress = clamp(
      (time - transitionState.startTime) / Math.max(transitionState.durationMs, 1),
      0,
      1
    );

    if (rawProgress < 0.46) {
      captionIndex = transitionState.fromIndex;
      opacity = 1 - smoothstep(0.06, 0.46, rawProgress);
    } else if (rawProgress > 0.54) {
      captionIndex = transitionState.toIndex;
      opacity = smoothstep(0.54, 0.96, rawProgress);
    } else {
      captionIndex = transitionState.toIndex;
      opacity = 0;
    }
  }

  const state = states[captionIndex];
  if (state && state.showCallout === false) {
    bridge.setSceneCaption?.({ opacity: 0 });
    return;
  }
  const anchor = getCaptionAnchor(state);
  const presented = getPresentedView(state);
  const cameraPlacement = getEffectiveCaptionCamera(state);
  const scale = cameraPlacement
    ? clamp((cameraPlacement.scale ?? 0.56) * (state?.captionScale ?? 1), 0.46, 0.96)
    : clamp(getDistance(presented) * 0.3 * (state?.captionScale ?? 1), 0.24, 0.68);

  if (opacity <= 0.01) {
    bridge.setSceneCaption?.({ opacity: 0 });
    return;
  }

  bridge.setSceneCaption?.({
    index: captionIndex,
    title: state?.title ?? toRoman(captionIndex + 1),
    text: state?.copy ?? "",
    anchor,
    opacity: opacity * 0.94,
    scale,
    style: project.calloutStyle,
    time,
  });
}

function getPresentedView(state) {
  if (!state?.view) {
    return null;
  }

  const presentation = getEffectivePresentation(state);
  const baseView = cloneView(state.view);
  const forward = getForward(baseView);
  const right = safeRight(forward);
  const up = normalize(cross(right, forward));
  const baseTarget = getFocusPoint(baseView);
  const dollyPosition = add(baseView.position, scale(forward, presentation.dolly));
  const aimedTarget = add(
    add(baseTarget, scale(right, presentation.aimX)),
    scale(up, presentation.aimY)
  );
  const direction = normalize(subtract(aimedTarget, dollyPosition));
  const aimedAngles = directionToAnglesStable(
    direction,
    baseView.angles?.[1] ?? 0,
    baseView.angles?.[2] ?? 0
  );
  const dollyDistance = Math.max(0.05, length(subtract(aimedTarget, dollyPosition)));

  return {
    position: dollyPosition,
    angles: aimedAngles,
    target: aimedTarget,
    distance: dollyDistance,
    fov: clamp((baseView.fov ?? 75) + presentation.fovTrim, 18, 110),
  };
}

function applyHandheld(view, time, state) {
  const referenceDistance = state?.view?.distance ?? getDistance(view);
  const distanceWeight = clamp(1 / (1 + Math.max(0, referenceDistance - 1.8) * 0.24), 0.38, 1);
  const positionalAmplitude = 0.00082 * distanceWeight;
  const phase = (state ? states.findIndex((entry) => entry.id === state.id) : 0) * 0.9;
  const forward = getForward(view);
  const right = safeRight(forward);
  const up = normalize(cross(right, forward));

  const jitterX =
    Math.sin(time * 0.0028 + phase * 0.7) +
    0.38 * Math.sin(time * 0.0061 + phase * 1.9) +
    0.17 * Math.cos(time * 0.0092 + phase * 0.4);
  const jitterY =
    Math.cos(time * 0.0023 + phase * 1.1) +
    0.34 * Math.cos(time * 0.0054 + phase * 0.6) +
    0.16 * Math.sin(time * 0.0083 + phase * 1.7);
  const jitterZ =
    Math.sin(time * 0.0021 + phase * 0.9) +
    0.28 * Math.sin(time * 0.0049 + phase * 1.4) +
    0.14 * Math.cos(time * 0.0074 + phase * 0.8);
  const pitchJitter =
    (Math.sin(time * 0.0021 + phase * 0.5) * 0.14 +
    Math.cos(time * 0.0054 + phase * 1.8) * 0.052) * distanceWeight;
  const yawJitter =
    (Math.cos(time * 0.0019 + phase * 0.8) * 0.11 +
    Math.sin(time * 0.0047 + phase * 1.3) * 0.04) * distanceWeight;
  const rollJitter =
    (Math.sin(time * 0.0024 + phase * 1.2) * 0.16 +
    Math.cos(time * 0.0058 + phase * 0.2) * 0.06) * distanceWeight;

  const driftOffset = add(
    scale(right, jitterX * positionalAmplitude),
    add(
      scale(up, jitterY * positionalAmplitude * 0.9),
      scale(forward, jitterZ * positionalAmplitude * 0.42)
    )
  );
  const jitteredAngles = [
    clamp((view.angles?.[0] ?? 0) + pitchJitter, -89.95, 89.95),
    normalizeAngleDegrees((view.angles?.[1] ?? 0) + yawJitter),
    (view.angles?.[2] ?? 0) + rollJitter,
  ];
  const jitteredPosition = add(view.position, driftOffset);
  const jitteredTarget = add(
    jitteredPosition,
    scale(forwardFromAngles(jitteredAngles), getDistance(view))
  );

  return {
    position: jitteredPosition,
    angles: jitteredAngles,
    target: jitteredTarget,
    distance: getDistance(view),
    fov: view.fov,
  };
}

function cloneView(view) {
  const angles = view.angles ? [...view.angles] : directionToAngles(getForward(view), 0);
  return {
    position: [...view.position],
    angles,
    target: view.target ? [...view.target] : getFocusPoint({ position: view.position, angles, distance: getDistance(view) }),
    distance: getDistance(view),
    fov: view.fov,
  };
}

function interpolateView(from, to, moveT, lookT = moveT) {
  const position = interpolateArray(from.position, to.position, moveT);
  const distance = lerp(getDistance(from), getDistance(to), moveT);
  const angles = [
    lerp(from.angles?.[0] ?? 0, to.angles?.[0] ?? 0, lookT),
    lerpAngleDegrees(from.angles?.[1] ?? 0, to.angles?.[1] ?? 0, lookT),
    lerpAngleDegrees(from.angles?.[2] ?? 0, to.angles?.[2] ?? 0, lookT),
  ];
  const target = add(position, scale(forwardFromAngles(angles), distance));

  return {
    position,
    target,
    angles,
    distance: Math.max(0.05, distance),
    fov: lerp(from.fov, to.fov, moveT),
  };
}

function interpolateArray(from, to, t) {
  return from.map((value, index) => lerp(value, to[index], t));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function applyEasing(t, easing) {
  const clamped = clamp(t, 0, 1);

  switch (easing) {
    case "linear":
      return clamped;
    case "easeInOutSine":
      return -(Math.cos(Math.PI * clamped) - 1) / 2;
    case "easeOutQuart":
      return 1 - Math.pow(1 - clamped, 4);
    case "easeOutExpo":
      return clamped === 1 ? 1 : 1 - Math.pow(2, -10 * clamped);
    case "easeInOutCubic":
    default:
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
  }
}

function softenProgress(t) {
  const clamped = clamp(t, 0, 1);
  return -(Math.cos(Math.PI * clamped) - 1) / 2;
}

function applyLookEasing(t) {
  const clamped = clamp(t, 0, 1);
  return softenProgress(softenProgress(clamped));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setStatus(state, message) {
  statusPill.dataset.state = state;
  statusPill.textContent = message;
}

function subtract(a, b) {
  return a.map((value, index) => value - b[index]);
}

function add(a, b) {
  return a.map((value, index) => value + b[index]);
}

function scale(vector, amount) {
  return vector.map((value) => value * amount);
}

function length(vector) {
  return Math.hypot(...vector);
}

function normalize(vector) {
  const vectorLength = length(vector);
  if (!vectorLength) {
    return [0, 0, -1];
  }

  return scale(vector, 1 / vectorLength);
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function safeRight(forward) {
  const worldUp = Math.abs(forward[1]) > 0.97 ? [0, 0, 1] : [0, 1, 0];
  return normalize(cross(forward, worldUp));
}

function computeTurnFactor(fromView, toView) {
  const fromForward = getForward(fromView);
  const toForward = getForward(toView);
  const dot = clamp(
    fromForward[0] * toForward[0] +
      fromForward[1] * toForward[1] +
      fromForward[2] * toForward[2],
    -1,
    1
  );
  const angularDelta = Math.acos(dot) / Math.PI;
  const yawDelta =
    Math.abs(shortestAngleDegrees(fromView.angles?.[1] ?? 0, toView.angles?.[1] ?? 0)) / 180;
  return clamp(Math.max(angularDelta, yawDelta * 0.7), 0, 1);
}

function getForward(view) {
  if (view?.angles) {
    return forwardFromAngles(view.angles);
  }

  if (view?.target && view?.position) {
    return normalize(subtract(view.target, view.position));
  }

  return [0, 0, -1];
}

function getDistance(view) {
  if (Number.isFinite(view?.distance)) {
    return view.distance;
  }

  if (view?.target && view?.position) {
    return length(subtract(view.target, view.position));
  }

  return 1;
}

function getFocusPoint(view) {
  if (view?.target) {
    return [...view.target];
  }

  return add(view.position, scale(forwardFromAngles(view.angles), getDistance(view)));
}

function getCaptionAnchor(state) {
  const presentedView = getPresentedView(state);
  const forward = getForward(presentedView);
  const right = safeRight(forward);
  const up = normalize(cross(right, forward));
  const cameraPlacement = getEffectiveCaptionCamera(state);

  if (cameraPlacement) {
    return add(
      add(
        add(
          presentedView.position,
          scale(forward, cameraPlacement.depth ?? Math.max(getDistance(presentedView) * 0.72, 2.4))
        ),
        scale(right, cameraPlacement.x ?? 0)
      ),
      scale(up, cameraPlacement.y ?? 0)
    );
  }

  const focus = getFocusPoint(presentedView);
  const anchor = state?.captionAnchor ?? {};

  return add(
    add(
      add(focus, scale(right, anchor.right ?? 0)),
      scale(up, anchor.up ?? 0.12)
    ),
    scale(forward, anchor.forward ?? 0)
  );
}

function forwardFromAngles(angles) {
  const pitch = (angles?.[0] ?? 0) * (Math.PI / 180);
  const yaw = (angles?.[1] ?? 0) * (Math.PI / 180);
  const cosPitch = Math.cos(pitch);

  return normalize([
    -Math.sin(yaw) * cosPitch,
    Math.sin(pitch),
    -Math.cos(yaw) * cosPitch,
  ]);
}

function directionToAngles(direction, fallbackYaw = 0) {
  const vector = normalize(direction);
  const pitch = Math.asin(clamp(vector[1], -1, 1)) * (180 / Math.PI);
  const horizontal = Math.hypot(vector[0], vector[2]);
  const yaw =
    horizontal < 1e-5
      ? fallbackYaw
      : Math.atan2(-vector[0], -vector[2]) * (180 / Math.PI);

  return [pitch, normalizeAngleDegrees(yaw), 0];
}

function directionToAnglesStable(direction, fallbackYaw = 0, roll = 0) {
  const vector = normalize(direction);
  const pitch = Math.asin(clamp(vector[1], -1, 1)) * (180 / Math.PI);
  const horizontal = Math.hypot(vector[0], vector[2]);
  const yaw =
    horizontal < 0.035
      ? fallbackYaw
      : Math.atan2(-vector[0], -vector[2]) * (180 / Math.PI);

  return [clamp(pitch, -89.95, 89.95), normalizeAngleDegrees(yaw), roll];
}

function normalizeAngleDegrees(angle) {
  return ((angle + 180) % 360 + 360) % 360 - 180;
}

function shortestAngleDegrees(from, to) {
  return normalizeAngleDegrees(to - from);
}

function lerpAngleDegrees(from, to, t) {
  return normalizeAngleDegrees(from + shortestAngleDegrees(from, to) * t);
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / Math.max(edge1 - edge0, 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

function toRoman(value) {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return numerals[value - 1] ?? String(value);
}

function createCrossfadeAudioLoop(src, volume) {
  if (!src) {
    return {
      ensureStarted() {
        return Promise.resolve(false);
      },
      update() {},
    };
  }

  const tracks = [new Audio(src), new Audio(src)];

  tracks.forEach((track) => {
    track.preload = "auto";
    track.loop = false;
    track.volume = 0;
  });

  let activeIndex = 0;
  let started = false;
  let starting = false;
  let crossfade = null;

  function prepareTrack(track) {
    track.pause();
    try {
      track.currentTime = 0;
    } catch (error) {
      // Some browsers reject immediate seeks before metadata is ready.
    }
    track.volume = 0;
  }

  async function ensureStarted() {
    if (started || starting) {
      return started;
    }

    starting = true;
    const firstTrack = tracks[activeIndex];
    prepareTrack(firstTrack);

    try {
      await firstTrack.play();
      firstTrack.volume = volume;
      started = true;
      return true;
    } catch (error) {
      return false;
    } finally {
      starting = false;
    }
  }

  function beginCrossfade() {
    if (crossfade) {
      return;
    }

    const fromTrack = tracks[activeIndex];
    const toIndex = activeIndex === 0 ? 1 : 0;
    const toTrack = tracks[toIndex];

    try {
      prepareTrack(toTrack);
      const playAttempt = toTrack.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {});
      }
    } catch (error) {
      return;
    }

    crossfade = {
      fromIndex: activeIndex,
      toIndex,
    };

    fromTrack.volume = volume;
    toTrack.volume = 0;
  }

  function update() {
    if (!started) {
      return;
    }

    const currentTrack = tracks[activeIndex];

    if (!Number.isFinite(currentTrack.duration) || currentTrack.duration <= 0) {
      return;
    }

    const remaining = currentTrack.duration - currentTrack.currentTime;

    if (!crossfade && remaining <= AUDIO_CROSSFADE_SECONDS) {
      beginCrossfade();
    }

    if (!crossfade) {
      currentTrack.volume = volume;
      return;
    }

    const fromTrack = tracks[crossfade.fromIndex];
    const toTrack = tracks[crossfade.toIndex];
    const fadeProgress = clamp(
      1 - (fromTrack.duration - fromTrack.currentTime) / AUDIO_CROSSFADE_SECONDS,
      0,
      1
    );

    fromTrack.volume = volume * (1 - fadeProgress);
    toTrack.volume = volume * fadeProgress;

    if (fadeProgress >= 0.999 || fromTrack.ended) {
      fromTrack.pause();
      fromTrack.volume = 0;
      activeIndex = crossfade.toIndex;
      tracks[activeIndex].volume = volume;
      crossfade = null;
    }
  }

  return {
    ensureStarted,
    update,
  };
}

async function loadProjectData() {
  const response = await fetch("./project.json");
  return response.json();
}

function normalizeProject(payload) {
  return {
    ...payload,
    viewer: {
      html: "./assets/scene.html",
      content: "./scene.sog",
      rev: "",
      ...(payload.viewer ?? {}),
    },
    site: {
      eyebrow: "",
      logoSrc: "",
      title: payload.sceneTitle ?? "Untitled Splat",
      person: "",
      body: "",
      links: [],
      ...(payload.site ?? {}),
    },
    theme: {
      displayFont: "Sora, sans-serif",
      bodyFont: '"Familjen Grotesk", sans-serif',
      detailFont: '"Azeret Mono", monospace',
      accent: "#d5b56d",
      accentSoft: "#95c8aa",
      panelBackground: "rgba(8, 12, 17, 0.88)",
      ...(payload.theme ?? {}),
    },
    calloutStyle: {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      titleColor: "rgba(248, 241, 227, 0.62)",
      textColor: "rgba(248, 241, 227, 0.98)",
      backingColor: "rgba(7, 11, 15, 0.68)",
      ...(payload.calloutStyle ?? {}),
    },
      effects: {
        sceneDustDensity: 0.75,
        sceneHazeDensity: 0.7,
        captionDustDensity: 0.8,
        captionDustSize: 1,
        captionHazeDensity: 0.72,
        lensSmudge: 0.18,
        grain: 0.11,
      overlayHaze: 0.18,
      ...(payload.effects ?? {}),
    },
    audio: {
      enabled: false,
      src: "",
      volume: 0.34,
      ...(payload.audio ?? {}),
    },
    states: Array.isArray(payload.states)
      ? payload.states.map((state, index) => ({
          label: `State ${String(index + 1).padStart(2, "0")}`,
          eyebrow: `Beat ${index + 1}`,
            title: `Callout ${index + 1}`,
            copy: "",
            infoTitle: "",
            infoBody: "",
            showCallout: state.showCallout !== false,
            showInfoPanel: state.showInfoPanel !== false,
            transition: {
            easing: "easeInOutCubic",
            duration: 1.2,
            ...(state.transition ?? {}),
          },
          presentation: {
            ...DEFAULT_PRESENTATION,
            ...(state.presentation ?? {}),
          },
          mobilePresentation: {
            ...DEFAULT_PRESENTATION,
            ...(state.mobilePresentation ?? state.presentation ?? {}),
          },
          captionCamera: {
            ...DEFAULT_CAPTION_CAMERA,
            ...(state.captionCamera ?? {}),
          },
          mobileCaptionCamera: {
            ...DEFAULT_CAPTION_CAMERA,
            ...(state.mobileCaptionCamera ?? state.captionCamera ?? {}),
          },
          ...state,
        }))
      : [],
  };
}

function getEffectivePresentation(state) {
  return {
    ...DEFAULT_PRESENTATION,
    ...(isMobileViewport()
      ? (state?.mobilePresentation ?? state?.presentation)
      : state?.presentation ?? {}),
  };
}

function getEffectiveCaptionCamera(state) {
  return {
    ...DEFAULT_CAPTION_CAMERA,
    ...(isMobileViewport()
      ? (state?.mobileCaptionCamera ?? state?.captionCamera)
      : state?.captionCamera ?? {}),
  };
}

function isMobileViewport() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}
