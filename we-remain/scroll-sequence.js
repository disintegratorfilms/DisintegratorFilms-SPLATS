const STORAGE_KEY = "alien-meadow-camera-states-v1";
const DEFAULT_PRESENTATION = {
  aimX: 0,
  aimY: 0,
  dolly: 0,
  fovTrim: 0,
};
const WHEEL_THRESHOLD = 70;
const SWIPE_THRESHOLD = 42;
const TRANSITION_SLOWDOWN = 2.3;
const AUDIO_SRC = "./assets/Cinematic Low Rumbling Bass-(SoundEffectsFactory.com)_.mp3";
const AUDIO_VOLUME = 0.34;
const AUDIO_CROSSFADE_SECONDS = 4.8;

const DEFAULT_STATES = [
  {
    id: "state-1776616156488",
    label: "State 01",
    transition: {
      easing: "easeInOutCubic",
      duration: 1.2,
    },
    presentation: {
      aimX: 0,
      aimY: 0,
      dolly: 0,
      fovTrim: 0,
    },
    title: "We Remain",
    eyebrow: "Arrival",
    copy:
      "Chris Bohn of Disintegrator Films works across photography, 3D design, animation, Gaussian splats, 3D printing, Unreal Engine, After Effects, and Blender.",
    infoTitle: "Immersive Worldbuilding",
    infoBody:
      "Chris Bohn builds cinematic visual worlds that connect photography, 3D design, animation, splats, physical making, and real-time presentation into one practice.",
    captionAnchor: { right: 1.02, up: 0.04, forward: 0.14 },
    captionScale: 0.8,
    view: {
      position: [0.10028, 2.066933, 0.008699],
      target: [0.099144, 0.40194, -0.016564],
      angles: [-89.129824, 2.57534, 0],
      distance: 1.665185,
      fov: 75,
      rotation: [-0.70154, 0.01601, 0.015769, 0.712276],
    },
  },
  {
    id: "state-1776616184148",
    label: "State 02",
    transition: {
      easing: "easeInOutCubic",
      duration: 1.2,
    },
    presentation: {
      aimX: 0,
      aimY: 0,
      dolly: 0,
      fovTrim: 0,
    },
    title: "What I Make",
    eyebrow: "Practice",
    copy:
      "Cinematic environments, experimental visuals, and immersive digital worlds built for screen and space.",
    infoTitle: "Cinematic Environments",
    infoBody:
      "The practice moves across visual art, scene design, Blender-based construction, splat capture, and mood-driven worldbuilding for screens, spaces, and interactive presentation.",
    captionAnchor: { right: 0.74, up: 0.18, forward: 0.08 },
    view: {
      position: [0.821985, 1.813083, 0.497146],
      target: [0.135066, 0.368817, 0.033383],
      angles: [-60.15, 55.97534, 0],
      distance: 1.665185,
      fov: 75,
      rotation: [-0.442525, 0.406102, 0.235173, 0.764164],
    },
  },
  {
    id: "state-1776616192864",
    label: "State 03",
    transition: {
      easing: "easeInOutCubic",
      duration: 1.2,
    },
    presentation: {
      aimX: 0,
      aimY: 0,
      dolly: 0,
      fovTrim: 0,
    },
    title: "What Makes It Different",
    eyebrow: "Approach",
    copy:
      "Realism, emotion, framing, storytelling, ambience and environment. The work is more than the sum of its parts.",
    infoTitle: "Spatial Storytelling",
    infoBody:
      "This work is not only about technical clarity. It is emotional image-making: camera, depth, atmosphere, and placement working together as one precise visual language.",
    captionAnchor: { right: 0.46, up: 0.28, forward: 0.14 },
    view: {
      position: [1.785578, 0.760227, -0.284332],
      target: [0.235454, 0.229101, 0.01208],
      angles: [-18.6, 100.82534, 0],
      distance: 1.665185,
      fov: 75,
      rotation: [-0.102983, 0.760524, 0.124541, 0.628877],
    },
  },
  {
    id: "state-1776616204232",
    label: "State 04",
    transition: {
      easing: "easeInOutCubic",
      duration: 1.2,
    },
    presentation: {
      aimX: 0,
      aimY: 0,
      dolly: 0,
      fovTrim: 0,
    },
    title: "Selected Directions",
    eyebrow: "Work",
    copy:
      "Experimental films, interactive pieces, digital environments, title design, and visual development.",
    infoTitle: "Across Mediums",
    infoBody:
      "My work spans commissioned visuals, title design, installations, interactive scenes, and personal pieces. The constant is a clear visual identity and a strong sense of atmosphere.",
    captionAnchor: { right: -0.56, up: 0.18, forward: 0.12 },
    captionScale: 0.96,
    view: {
      position: [0.005949, 1.321629, -0.296402],
      target: [0.005949, 0.229101, -0.296402],
      angles: [-90, 3.92534, 0],
      distance: 1.092528,
      fov: 75,
      rotation: [-0.706692, 0.024217, 0.024217, 0.706692],
    },
  },
  {
    id: "state-1776616214550",
    label: "State 05",
    transition: {
      easing: "easeInOutCubic",
      duration: 1.2,
    },
    presentation: {
      aimX: 0,
      aimY: 0,
      dolly: 0,
      fovTrim: 0,
    },
    title: "Work With Me",
    eyebrow: "Contact",
    copy:
      "Open for commissions, collaborations, and visual projects that need a world with atmosphere.",
    infoTitle: "Start A Conversation",
    infoBody:
      "If you're developing a film, installation, performance, campaign, or personal project and need a world that tells a story, feel free to reach out. I'm open to commissions, collaborations, and select freelance work.",
    captionAnchor: { right: 0.62, up: -0.28, forward: 0.16 },
    captionScale: 0.88,
    view: {
      position: [-0.582285, 1.285711, 0.293797],
      target: [-0.017441, 0.144338, -0.060877],
      angles: [-59.7, -57.87466, 0],
      distance: 1.321958,
      fov: 75,
      rotation: [-0.435589, -0.419661, -0.240828, 0.759045],
    },
  },
];

const viewerFrame = document.querySelector("#viewer-frame");
const statusPill = document.querySelector("#status-pill");
const progressBar = document.querySelector("#progress-bar");
const scrollTrack = document.querySelector("#scroll-track");
const spacerTemplate = document.querySelector("#scroll-spacer-template");
const infoEyebrow = document.querySelector("#info-eyebrow");
const infoTitle = document.querySelector("#info-title");
const infoBody = document.querySelector("#info-body");
const audioManager = createCrossfadeAudioLoop(AUDIO_SRC);

let bridge = null;
let states = loadStates();
let sections = [];
let renderHandle = 0;
let activeIndex = 0;
let settledIndex = 0;
let currentBaseView = null;
let transitionState = null;
let wheelIntent = 0;
let touchStartY = null;

window.addEventListener("message", handleBridgeMessage);
configureViewerSource();
renderSpacers();
connectToViewer();
bindNavigation();

function configureViewerSource() {
  const url = new URL(window.location.href);
  const html = url.searchParams.get("html");
  const content = url.searchParams.get("content");
  const rev = url.searchParams.get("rev");

  if (!html) {
    return;
  }

  const frameUrl = new URL(html, window.location.href);
  if (content) {
    frameUrl.searchParams.set("content", content);
  }
  if (rev) {
    frameUrl.searchParams.set("rev", rev);
  }

  viewerFrame.src = frameUrl.toString();
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
}

function handleResize() {
  sections = Array.from(document.querySelectorAll(".scroll-spacer"));
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
    infoEyebrow.textContent = state.eyebrow ?? state.label ?? "";
    infoTitle.textContent = state.infoTitle ?? state.title ?? state.label ?? "";
    infoBody.textContent = state.infoBody ?? "";
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
  const anchor = getCaptionAnchor(state);
  const presented = getPresentedView(state);
  const scale = clamp(
    getDistance(presented) * 0.23 * (state?.captionScale ?? 1),
    0.14,
    0.4
  );

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
    time,
  });
}

function getPresentedView(state) {
  if (!state?.view) {
    return null;
  }

  const presentation = {
    ...DEFAULT_PRESENTATION,
    ...(state.presentation ?? {}),
  };
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
  const positionalAmplitude = 0.00055 + referenceDistance * 0.00024;
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
    Math.sin(time * 0.0021 + phase * 0.5) * (0.1 + referenceDistance * 0.035) +
    Math.cos(time * 0.0054 + phase * 1.8) * (0.038 + referenceDistance * 0.012);
  const yawJitter =
    Math.cos(time * 0.0019 + phase * 0.8) * (0.08 + referenceDistance * 0.028) +
    Math.sin(time * 0.0047 + phase * 1.3) * (0.03 + referenceDistance * 0.01);
  const rollJitter =
    Math.sin(time * 0.0024 + phase * 1.2) * (0.14 + referenceDistance * 0.048) +
    Math.cos(time * 0.0058 + phase * 0.2) * (0.05 + referenceDistance * 0.018);

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
  const focus = getFocusPoint(presentedView);
  const forward = getForward(presentedView);
  const right = safeRight(forward);
  const up = normalize(cross(right, forward));
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

function loadStates() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("source") !== "storage") {
    return structuredClone(DEFAULT_STATES);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return structuredClone(DEFAULT_STATES);
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return structuredClone(DEFAULT_STATES);
    }

    return parsed.map((state, index) => {
      const fallback = DEFAULT_STATES[index % DEFAULT_STATES.length];

      return {
        ...fallback,
        ...state,
        transition: {
          ...fallback.transition,
          ...(state.transition ?? {}),
        },
        presentation: {
          ...DEFAULT_PRESENTATION,
          ...fallback.presentation,
          ...(state.presentation ?? {}),
        },
        title: fallback.title,
        eyebrow: fallback.eyebrow,
        infoTitle: fallback.infoTitle,
        infoBody: fallback.infoBody,
        captionAnchor: fallback.captionAnchor,
        copy: fallback.copy,
      };
    });
  } catch (error) {
    console.warn(error);
    return structuredClone(DEFAULT_STATES);
  }
}

function createCrossfadeAudioLoop(src) {
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
      firstTrack.volume = AUDIO_VOLUME;
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

    fromTrack.volume = AUDIO_VOLUME;
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
      currentTrack.volume = AUDIO_VOLUME;
      return;
    }

    const fromTrack = tracks[crossfade.fromIndex];
    const toTrack = tracks[crossfade.toIndex];
    const fadeProgress = clamp(
      1 - (fromTrack.duration - fromTrack.currentTime) / AUDIO_CROSSFADE_SECONDS,
      0,
      1
    );

    fromTrack.volume = AUDIO_VOLUME * (1 - fadeProgress);
    toTrack.volume = AUDIO_VOLUME * fadeProgress;

    if (fadeProgress >= 0.999 || fromTrack.ended) {
      fromTrack.pause();
      fromTrack.volume = 0;
      activeIndex = crossfade.toIndex;
      tracks[activeIndex].volume = AUDIO_VOLUME;
      crossfade = null;
    }
  }

  return {
    ensureStarted,
    update,
  };
}
