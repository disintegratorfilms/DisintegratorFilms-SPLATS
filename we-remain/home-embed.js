const HOME_VIEW = {
  position: [0.10028, 2.066933, 0.008699],
  target: [0.099144, 0.40194, -0.016564],
  angles: [-89.129824, 2.57534, 0],
  distance: 1.665185,
  fov: 75,
  rotation: [-0.70154, 0.01601, 0.015769, 0.712276],
};

const viewerFrame = document.querySelector("#viewer-frame");
const statusPill = document.querySelector("#status-pill");

let bridge = null;
let renderHandle = 0;

window.addEventListener("message", handleBridgeMessage);
connectToViewer();

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
  if (bridge) {
    return;
  }

  bridge = candidate;
  bridge.releaseManualControl?.();
  bridge.setSceneCaption?.({ opacity: 0 });
  bridge.setCurrentView(applyHomeDrift(HOME_VIEW, performance.now()));
  setStatus("ready", "We Remain ready.");
  startRenderLoop();
}

function startRenderLoop() {
  if (renderHandle) {
    return;
  }

  const frame = (time) => {
    renderHandle = window.requestAnimationFrame(frame);
    if (!bridge) {
      return;
    }
    bridge.setCurrentView(applyHomeDrift(HOME_VIEW, time));
  };

  renderHandle = window.requestAnimationFrame(frame);
}

function applyHomeDrift(view, time) {
  const drift = isMobileViewport()
    ? { x: 0.004, y: 0.005, z: 0.003, pitch: 0.06, yaw: 0.08, roll: 0.05 }
    : { x: 0.006, y: 0.008, z: 0.004, pitch: 0.08, yaw: 0.11, roll: 0.07 };
  const t = time * 0.001;

  return {
    ...view,
    position: [
      view.position[0] + Math.sin(t * 0.21) * drift.x + Math.cos(t * 0.41) * drift.x * 0.42,
      view.position[1] + Math.cos(t * 0.17) * drift.y + Math.sin(t * 0.33) * drift.y * 0.35,
      view.position[2] + Math.sin(t * 0.14) * drift.z,
    ],
    angles: [
      view.angles[0] + Math.sin(t * 0.27) * drift.pitch,
      view.angles[1] + Math.cos(t * 0.19) * drift.yaw,
      view.angles[2] + Math.sin(t * 0.31) * drift.roll,
    ],
    target: view.target,
  };
}

function setStatus(state, message) {
  statusPill.dataset.state = state;
  statusPill.textContent = message;
}

function isMobileViewport() {
  return window.innerWidth <= 640;
}
