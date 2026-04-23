(() => {
window.__SPLATSITE_INSTALL_BRIDGE__ = async (viewer) => {
                window.sse = window.sse || {};
                const runtime = window.__SPLATSITE_RUNTIME__;
                if (!runtime) {
                    throw new Error('SplatSite runtime context was not found.');
                }
                const {
                    Quat,
                    Vec3,
                    Mesh,
                    PlaneGeometry,
                    Entity,
                    MeshInstance,
                    StandardMaterial,
                    Color,
                    Texture,
                    PIXELFORMAT_RGBA8,
                    FILTER_LINEAR,
                    BlendState,
                    BLENDEQUATION_ADD,
                    BLENDMODE_SRC_ALPHA,
                    BLENDMODE_ONE_MINUS_SRC_ALPHA,
                    BLENDMODE_ONE,
                    CULLFACE_NONE,
                    Camera: SplatCamera
                } = runtime;
                const round = (value) => Number(value.toFixed(6));
                const copyArray = (values) => values.map((value) => round(value));
                const copyQuat = (quat) => copyArray([quat.x, quat.y, quat.z, quat.w]);
                const rotationFromAngles = (angles) => new Quat().setFromEulerAngles(
                    angles?.[0] ?? 0,
                    angles?.[1] ?? 0,
                    angles?.[2] ?? 0
                );
                const createViewCamera = (view) => {
                    const result = new SplatCamera();
                    result.fov = view.fov ?? 75;
                    result.position.set(view.position?.[0] ?? 0, view.position?.[1] ?? 0, view.position?.[2] ?? 0);
                    if (view.angles) {
                        result.angles.set(view.angles?.[0] ?? 0, view.angles?.[1] ?? 0, view.angles?.[2] ?? 0);
                        result.distance = view.distance ?? 1;
                        return result;
                    }
                    if (view.position && view.target) {
                        result.look(new Vec3(view.position), new Vec3(view.target));
                        result.fov = view.fov ?? result.fov;
                        return result;
                    }
                    result.angles.set(0, 0, 0);
                    result.distance = view.distance ?? 1;
                    return result;
                };
                const serializeCamera = () => {
                    const source = viewer.cameraManager?.camera;
                    if (!source) {
                        return null;
                    }
                    const target = new Vec3();
                    source.calcFocusPoint(target);
                    const rotation = viewer.global.camera.getRotation();
                    return {
                        position: [round(source.position.x), round(source.position.y), round(source.position.z)],
                        target: [round(target.x), round(target.y), round(target.z)],
                        angles: [round(source.angles.x), round(source.angles.y), round(source.angles.z)],
                        distance: round(source.distance),
                        fov: round(source.fov),
                        rotation: copyQuat(rotation)
                    };
                };
                const normalizeView = (view) => {
                    const camera = createViewCamera(view);
                    const target = new Vec3();
                    camera.calcFocusPoint(target);
                    const rotation = view?.rotation?.length === 4
                        ? copyArray(view.rotation)
                        : copyQuat(rotationFromAngles([camera.angles.x, camera.angles.y, camera.angles.z]));
                    return {
                        position: copyArray([camera.position.x, camera.position.y, camera.position.z]),
                        target: copyArray([target.x, target.y, target.z]),
                        angles: copyArray([camera.angles.x, camera.angles.y, camera.angles.z]),
                        distance: round(camera.distance),
                        fov: round(camera.fov),
                        rotation
                    };
                };
                const applyCameraState = (view) => {
                    const camera = createViewCamera(view);
                    if (viewer.cameraManager?.camera) {
                        viewer.cameraManager.camera.copy(camera);
                    }
                    viewer.global.camera.setPosition(camera.position);
                    if (view?.rotation?.length === 4) {
                        viewer.global.camera.setRotation(view.rotation[0], view.rotation[1], view.rotation[2], view.rotation[3]);
                    } else {
                        viewer.global.camera.setEulerAngles(camera.angles);
                    }
                    viewer.global.camera.camera.fov = camera.fov;
                    viewer.global.app.renderNextFrame = true;
                };
                const createSceneCaptionManager = () => {
                    const app = viewer.global.app;
                    const worldLayerId = app.scene.defaultDrawLayer?.id;
                    const planeMesh = Mesh.fromGeometry(app.graphicsDevice, new PlaneGeometry({
                        widthSegments: 1,
                        lengthSegments: 1
                    }));
                    const root = new Entity('scene-caption-root');
                    root.enabled = false;
                    app.root.addChild(root);
                    const atmosphereRoot = new Entity('scene-atmosphere-root');
                    atmosphereRoot.enabled = true;
                    app.root.addChild(atmosphereRoot);
                    const defaultAtmosphere = {
                        sceneDustDensity: 0.75,
                        sceneHazeDensity: 0.7,
                        captionDustDensity: 0.8,
                        captionDustSize: 1,
                        captionHazeDensity: 0.72
                    };
                    let atmosphereSettings = {
                        ...defaultAtmosphere
                    };
                    const defaultCaptionStyle = {
                        fontFamily: '"Segoe UI", Arial, sans-serif',
                        titleColor: 'rgba(248, 241, 227, 0.62)',
                        textColor: 'rgba(248, 241, 227, 0.98)',
                        backingColor: 'rgba(7, 11, 15, 0.68)'
                    };
                    let currentCaptionStyle = {
                        ...defaultCaptionStyle
                    };
                    const makeTextureFromCanvas = (canvas) => {
                        const ctx = canvas.getContext('2d');
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        return new Texture(app.graphicsDevice, {
                            width: canvas.width,
                            height: canvas.height,
                            format: PIXELFORMAT_RGBA8,
                            magFilter: FILTER_LINEAR,
                            minFilter: FILTER_LINEAR,
                            mipmaps: false,
                            levels: [new Uint8Array(imageData.data.buffer)]
                        });
                    };
                    const wrapText = (ctx, text, maxWidth) => {
                        const words = text.split(/\s+/);
                        const lines = [];
                        let line = '';
                        for (let i = 0; i < words.length; i++) {
                            const testLine = line ? `${line} ${words[i]}` : words[i];
                            if (ctx.measureText(testLine).width > maxWidth && line) {
                                lines.push(line);
                                line = words[i];
                            } else {
                                line = testLine;
                            }
                        }
                        if (line) {
                            lines.push(line);
                        }
                        return lines;
                    };
                    const buildCaptionTexture = (title, text, style) => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 3584;
                        canvas.height = 1984;
                        const ctx = canvas.getContext('2d');
                        const mergedStyle = {
                            ...defaultCaptionStyle,
                            ...(style ?? {})
                        };
                        ctx.font = `700 132px ${mergedStyle.fontFamily}`;
                        const paragraphs = String(text ?? '')
                            .split(/\n+/)
                            .map((line) => line.trim())
                            .filter(Boolean);
                        const lines = paragraphs.flatMap((paragraph, index) => {
                            const wrapped = wrapText(ctx, paragraph, 2640);
                            if (index < paragraphs.length - 1) {
                                wrapped.push('');
                            }
                            return wrapped;
                        });
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.save();
                        ctx.filter = 'blur(82px)';
                        ctx.fillStyle = mergedStyle.backingColor;
                        ctx.fillRect(180, 180, 2920, 390 + lines.length * 188);
                        ctx.restore();
                        ctx.fillStyle = mergedStyle.titleColor;
                        ctx.font = `700 64px ${mergedStyle.fontFamily}`;
                        ctx.textAlign = 'left';
                        ctx.fillText(title ?? '', 250, 278);
                        ctx.fillStyle = mergedStyle.textColor;
                        ctx.font = `700 132px ${mergedStyle.fontFamily}`;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.shadowColor = 'rgba(8, 12, 16, 0.74)';
                        ctx.shadowBlur = 40;
                        let y = 354;
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i]) {
                                ctx.fillText(lines[i], 250, y);
                                y += 168;
                            } else {
                                y += 88;
                            }
                        }
                        return makeTextureFromCanvas(canvas);
                    };
                    const buildDustTexture = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 128;
                        canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
                        gradient.addColorStop(0, 'rgba(248, 241, 227, 1)');
                        gradient.addColorStop(0.28, 'rgba(248, 241, 227, 0.38)');
                        gradient.addColorStop(0.7, 'rgba(248, 241, 227, 0.07)');
                        gradient.addColorStop(1, 'rgba(248, 241, 227, 0)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(0, 0, 128, 128);
                        return makeTextureFromCanvas(canvas);
                    };
                    const createTextMaterial = (texture, tint, opacity) => {
                        const material = new StandardMaterial();
                        material.diffuse = Color.BLACK;
                        material.emissive = new Color(tint[0], tint[1], tint[2]);
                        material.emissiveMap = texture;
                        material.opacityMap = texture;
                        material.opacity = opacity;
                        material.alphaTest = 0.01;
                        material.blendState = new BlendState(true, BLENDEQUATION_ADD, BLENDMODE_SRC_ALPHA, BLENDMODE_ONE_MINUS_SRC_ALPHA, BLENDEQUATION_ADD, BLENDMODE_ONE, BLENDMODE_ONE);
                        material.depthTest = true;
                        material.depthWrite = false;
                        material.cull = CULLFACE_NONE;
                        material.useLighting = false;
                        material.update();
                        return material;
                    };
                    const dustTexture = buildDustTexture();
                    const dustMaterial = createTextMaterial(dustTexture, [0.92, 0.9, 0.84], 0.18);
                    const hazeMaterial = createTextMaterial(dustTexture, [0.86, 0.88, 0.82], 0.08);
                    const sceneDustMaterial = createTextMaterial(dustTexture, [0.96, 0.94, 0.9], 0.13);
                    const sceneHazeMaterial = createTextMaterial(dustTexture, [0.74, 0.8, 0.74], 0.058);
                    const sceneDustParticles = [];
                    for (let i = 0; i < 760; i++) {
                        const particle = new Entity(`scene-atmosphere-dust-${i}`);
                        const meshInstance = new MeshInstance(planeMesh, sceneDustMaterial, particle);
                        meshInstance.cull = false;
                        particle.addComponent('render', {
                            layers: worldLayerId ? [worldLayerId] : undefined,
                            meshInstances: [meshInstance]
                        });
                        particle.setLocalEulerAngles(90, 0, 0);
                        atmosphereRoot.addChild(particle);
                        sceneDustParticles.push({
                            entity: particle,
                            seed: 4.2 + i * 9.73,
                            spreadX: 0.85 + (i % 7) * 0.24,
                            spreadY: 0.46 + (i % 6) * 0.14,
                            depth: 0.4 + (i % 11) * 0.22,
                            size: 0.005 + (i % 5) * 0.0042,
                            speed: 0.000018 + (i % 9) * 0.0000042,
                            drift: 0.04 + (i % 8) * 0.016
                        });
                    }
                    const sceneHazeSheets = [];
                    for (let i = 0; i < 72; i++) {
                        const sheet = new Entity(`scene-atmosphere-haze-${i}`);
                        const meshInstance = new MeshInstance(planeMesh, sceneHazeMaterial, sheet);
                        meshInstance.cull = false;
                        sheet.addComponent('render', {
                            layers: worldLayerId ? [worldLayerId] : undefined,
                            meshInstances: [meshInstance]
                        });
                        sheet.setLocalEulerAngles(90, 0, 0);
                        atmosphereRoot.addChild(sheet);
                        sceneHazeSheets.push({
                            entity: sheet,
                            seed: 12.4 + i * 5.87,
                            spreadX: 1.2 + (i % 5) * 0.36,
                            spreadY: 0.24 + (i % 4) * 0.12,
                            depth: 0.7 + (i % 6) * 0.35,
                            size: 0.22 + (i % 5) * 0.14,
                            speed: 0.000008 + (i % 5) * 0.0000025,
                            drift: 0.03 + (i % 4) * 0.014
                        });
                    }
                    const captionLayers = [];
                    for (let i = 0; i < 12; i++) {
                        const layerEntity = new Entity(`scene-caption-layer-${i}`);
                        const material = createTextMaterial(dustTexture, [1, 1, 1], i === 0 ? 1 : Math.max(0.08, 0.26 - i * 0.04));
                        const meshInstance = new MeshInstance(planeMesh, material);
                        meshInstance.cull = false;
                        meshInstance.castShadow = false;
                        meshInstance.receiveShadow = false;
                        layerEntity.addComponent('render', {
                            layers: worldLayerId ? [worldLayerId] : undefined,
                            meshInstances: [meshInstance]
                        });
                        layerEntity.setLocalEulerAngles(90, 0, 0);
                        layerEntity.setLocalPosition(i * 0.0045, -i * 0.0024, -i * 0.022);
                        layerEntity.setLocalScale(1 + i * 0.014, 1 + i * 0.014, 1);
                        root.addChild(layerEntity);
                        captionLayers.push({
                            entity: layerEntity,
                            material
                        });
                    }
                    const dustParticles = [];
                    for (let i = 0; i < 320; i++) {
                        const particle = new Entity(`scene-caption-dust-${i}`);
                        const meshInstance = new MeshInstance(planeMesh, dustMaterial, particle);
                        meshInstance.cull = false;
                        particle.addComponent('render', {
                            layers: worldLayerId ? [worldLayerId] : undefined,
                            meshInstances: [meshInstance]
                        });
                        particle.setLocalEulerAngles(90, 0, 0);
                        root.addChild(particle);
                        dustParticles.push({
                            entity: particle,
                            seed: i * 17.31 + 3.1,
                            radius: 0.06 + (i % 7) * 0.018,
                            size: 0.008 + (i % 5) * 0.005,
                            speed: 0.00014 + (i % 9) * 0.000021,
                            lift: 0.045 + (i % 6) * 0.014
                        });
                    }
                    const hazeWisps = [];
                    for (let i = 0; i < 44; i++) {
                        const wisp = new Entity(`scene-caption-haze-${i}`);
                        const meshInstance = new MeshInstance(planeMesh, hazeMaterial, wisp);
                        meshInstance.cull = false;
                        wisp.addComponent('render', {
                            layers: worldLayerId ? [worldLayerId] : undefined,
                            meshInstances: [meshInstance]
                        });
                        wisp.setLocalEulerAngles(90, 0, 0);
                        root.addChild(wisp);
                        hazeWisps.push({
                            entity: wisp,
                            seed: 9.7 + i * 13.11,
                            radius: 0.14 + (i % 4) * 0.045,
                            size: 0.16 + (i % 5) * 0.05,
                            speed: 0.00005 + (i % 4) * 0.000015,
                            lift: 0.026 + (i % 3) * 0.014
                        });
                    }
                    let currentCaption = null;
                    let activeTexture = null;
                    let currentOpacity = 0;
                    const updateAtmosphere = (time) => {
                        const view = serializeCamera();
                        const cameraPosition = viewer.global.camera.getPosition();
                        atmosphereRoot.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);
                        atmosphereRoot.setRotation(viewer.global.camera.getRotation());
                        const distanceScale = Math.max(1, (view?.distance ?? 1.6) * 0.9);
                        const sceneDustIntensity = Math.max(0, atmosphereSettings.sceneDustDensity ?? 0);
                        const sceneDustExtra = Math.max(0, sceneDustIntensity - 1);
                        sceneDustMaterial.opacity = 0.13 * Math.min(2.6, 0.5 + sceneDustIntensity * 0.8);
                        sceneDustMaterial.update();
                        const maxSceneDust = Math.min(sceneDustParticles.length, Math.floor(sceneDustParticles.length * Math.min(sceneDustIntensity, 1)));
                        sceneDustParticles.forEach((particle, index) => {
                            if (index >= maxSceneDust) {
                                particle.entity.enabled = false;
                                return;
                            }
                            const t = time * particle.speed + particle.seed;
                            const x = Math.sin(t * 0.73 + index * 0.11) * particle.spreadX * distanceScale;
                            const y = Math.cos(t * 0.52 + index * 0.07) * particle.spreadY + Math.sin(t * 0.16) * particle.drift;
                            const z = -particle.depth * distanceScale + Math.sin(t * 0.41 + index * 0.03) * particle.drift * 0.8;
                            particle.entity.setLocalPosition(x, y, z);
                            const sceneDustScale = particle.size * (1 + sceneDustExtra * 0.55);
                            particle.entity.setLocalScale(sceneDustScale, sceneDustScale, sceneDustScale);
                            particle.entity.enabled = true;
                        });
                        const sceneHazeIntensity = Math.max(0, atmosphereSettings.sceneHazeDensity ?? 0);
                        const sceneHazeExtra = Math.max(0, sceneHazeIntensity - 1);
                        sceneHazeMaterial.opacity = 0.058 * Math.min(3.2, 0.55 + sceneHazeIntensity);
                        sceneHazeMaterial.update();
                        const maxSceneHaze = Math.min(sceneHazeSheets.length, Math.floor(sceneHazeSheets.length * Math.min(sceneHazeIntensity, 1)));
                        sceneHazeSheets.forEach((sheet, index) => {
                            if (index >= maxSceneHaze) {
                                sheet.entity.enabled = false;
                                return;
                            }
                            const t = time * sheet.speed + sheet.seed;
                            const x = Math.sin(t * 0.38 + index * 0.23) * sheet.spreadX * distanceScale;
                            const y = Math.cos(t * 0.26 + index * 0.14) * sheet.spreadY;
                            const z = -sheet.depth * distanceScale + Math.sin(t * 0.18 + index * 0.09) * sheet.drift;
                            sheet.entity.setLocalPosition(x, y, z);
                            const sceneHazeScale = 1 + sceneHazeExtra * 0.65;
                            sheet.entity.setLocalScale(sheet.size * 2.4 * sceneHazeScale, sheet.size * 1.35 * sceneHazeScale, sheet.size);
                            sheet.entity.enabled = true;
                        });
                    };
                    const setTexture = (texture) => {
                        if (activeTexture && activeTexture !== dustTexture) {
                            activeTexture.destroy();
                        }
                        activeTexture = texture;
                        captionLayers.forEach((layer, index) => {
                            const depth = index / Math.max(captionLayers.length - 1, 1);
                            const tint = index === 0
                                ? [0.99, 0.97, 0.92]
                                : [
                                    0.44 - depth * 0.22,
                                    0.34 - depth * 0.18,
                                    0.26 - depth * 0.14
                                ];
                            layer.material.emissiveMap = texture;
                            layer.material.opacityMap = texture;
                            layer.material.emissive = new Color(tint[0], tint[1], tint[2]);
                            layer.material.update();
                        });
                    };
                    const update = (time) => {
                        updateAtmosphere(time);
                        if (!currentCaption || currentOpacity <= 0.001) {
                            root.enabled = false;
                            return;
                        }
                        root.enabled = true;
                        root.setPosition(currentCaption.anchor[0], currentCaption.anchor[1], currentCaption.anchor[2]);
                        root.setRotation(viewer.global.camera.getRotation());
                        const aspect = activeTexture ? activeTexture.width / Math.max(activeTexture.height, 1) : 2;
                        const baseScale = currentCaption.scale ?? 0.42;
                        root.setLocalScale(baseScale * aspect, baseScale, baseScale);
                        captionLayers.forEach((layer, index) => {
                            layer.entity.enabled = true;
                            layer.material.opacity = currentOpacity * (index === 0 ? 1 : Math.max(0.06, 0.28 - index * 0.018));
                            layer.material.update();
                        });
                        const captionDustIntensity = Math.max(0, atmosphereSettings.captionDustDensity ?? 0);
                        const captionDustExtra = Math.max(0, captionDustIntensity - 1);
                        const captionDustSize = Math.max(0.2, atmosphereSettings.captionDustSize ?? 1);
                        dustMaterial.opacity = 0.18 * Math.min(3, 0.5 + captionDustIntensity);
                        dustMaterial.update();
                        const maxCaptionDust = Math.min(dustParticles.length, Math.floor(dustParticles.length * Math.min(captionDustIntensity, 1)));
                        dustParticles.forEach((particle, index) => {
                            if (index >= maxCaptionDust) {
                                particle.entity.enabled = false;
                                return;
                            }
                            const t = time * particle.speed + particle.seed;
                            const x = Math.sin(t * 1.1 + index * 0.03) * particle.radius * 0.34;
                            const y = Math.cos(t * 0.82 + index * 0.05) * particle.radius * 0.14 + ((t * 0.18 + index * 0.03) % 1.0) * particle.lift - 0.04;
                            const z = -0.14 - Math.abs(Math.cos(t * 1.08 + index * 0.02)) * (0.14 + particle.radius * 0.45);
                            particle.entity.setLocalPosition(x, y, z);
                            const captionDustScale = particle.size * captionDustSize * (1 + captionDustExtra * 0.28);
                            particle.entity.setLocalScale(captionDustScale, captionDustScale, captionDustScale);
                            particle.entity.enabled = currentOpacity > 0.04;
                        });
                        const captionHazeIntensity = Math.max(0, atmosphereSettings.captionHazeDensity ?? 0);
                        const captionHazeExtra = Math.max(0, captionHazeIntensity - 1);
                        hazeMaterial.opacity = 0.08 * Math.min(3.2, 0.5 + captionHazeIntensity);
                        hazeMaterial.update();
                        const maxCaptionHaze = Math.min(hazeWisps.length, Math.floor(hazeWisps.length * Math.min(captionHazeIntensity, 1)));
                        hazeWisps.forEach((wisp, index) => {
                            if (index >= maxCaptionHaze) {
                                wisp.entity.enabled = false;
                                return;
                            }
                            const t = time * wisp.speed + wisp.seed;
                            const x = Math.sin(t * 0.62 + index * 0.04) * wisp.radius * 0.24;
                            const y = Math.cos(t * 0.48 + index * 0.07) * 0.03 + Math.sin(t * 0.18 + index) * wisp.lift;
                            const z = -0.22 - Math.abs(Math.cos(t * 0.74 + index * 0.03)) * (0.16 + wisp.radius * 0.42);
                            wisp.entity.setLocalPosition(x, y, z);
                            const captionHazeScale = 1 + captionHazeExtra * 0.6;
                            wisp.entity.setLocalScale(wisp.size * 1.7 * captionHazeScale, wisp.size * captionHazeScale, wisp.size);
                            wisp.entity.enabled = currentOpacity > 0.02;
                        });
                    };
                    return {
                        setCaption(data) {
                            if (!data || !data.text || !data.anchor || (data.opacity ?? 0) <= 0.001) {
                                currentCaption = null;
                                currentOpacity = 0;
                                return;
                            }
                            currentOpacity = data.opacity ?? 1;
                            const nextStyle = {
                                ...defaultCaptionStyle,
                                ...(data.style ?? {})
                            };
                            const changedText = !currentCaption || currentCaption.text !== data.text || currentCaption.title !== data.title;
                            const changedStyle = JSON.stringify(currentCaptionStyle) !== JSON.stringify(nextStyle);
                            currentCaption = data;
                            currentCaptionStyle = nextStyle;
                            if (changedText || changedStyle) {
                                setTexture(buildCaptionTexture(data.title ?? '', data.text ?? '', currentCaptionStyle));
                            }
                        },
                        setAtmosphere(settings) {
                            atmosphereSettings = {
                                ...atmosphereSettings,
                                ...(settings ?? {})
                            };
                        },
                        update
                    };
                };
                const sceneCaptionManager = createSceneCaptionManager();
                const projectPoint = (point) => {
                    if (!point || point.length < 3) {
                        return null;
                    }
                    const worldPoint = new Vec3(point);
                    const screenPoint = viewer.global.camera.camera.worldToScreen(worldPoint);
                    const canvas = viewer.global.app.graphicsDevice.canvas;
                    const width = canvas.clientWidth || canvas.width || 1;
                    const height = canvas.clientHeight || canvas.height || 1;
                    return {
                        x: screenPoint.x / width,
                        y: screenPoint.y / height,
                        z: screenPoint.z,
                        visible: screenPoint.z > 0 && screenPoint.x >= 0 && screenPoint.x <= width && screenPoint.y >= 0 && screenPoint.y <= height
                    };
                };
                const manualControl = {
                    enabled: false,
                    view: null,
                    wrapped: false
                };
                const attachManualControl = () => {
                    if (manualControl.wrapped || !viewer.cameraManager?.update) {
                        return false;
                    }
                    const originalUpdate = viewer.cameraManager.update.bind(viewer.cameraManager);
                    viewer.cameraManager.update = (deltaTime, frame) => {
                        if (manualControl.enabled && manualControl.view) {
                            applyCameraState(manualControl.view);
                            sceneCaptionManager.update(performance.now());
                            return;
                        }
                        originalUpdate(deltaTime, frame);
                        sceneCaptionManager.update(performance.now());
                    };
                    manualControl.wrapped = true;
                    return true;
                };
                const waitForCameraManager = () => {
                    if (!attachManualControl()) {
                        window.requestAnimationFrame(waitForCameraManager);
                    }
                };
                const goToView = (view) => {
                    if (!view?.position || !view?.target) {
                        return false;
                    }
                    viewer.global.events.fire('annotation.activate', {
                        camera: {
                            initial: {
                                position: view.position,
                                target: view.target,
                                fov: view.fov ?? 75
                            }
                        }
                    });
                    viewer.global.app.renderNextFrame = true;
                    return true;
                };
                window.sse.viewer = viewer;
                window.sse.global = viewer.global;
                window.sse.bridge = {
                    getCurrentView: serializeCamera,
                    goToView,
                    setCurrentView: (view) => {
                        manualControl.enabled = true;
                        manualControl.view = normalizeView(view);
                        applyCameraState(manualControl.view);
                        return true;
                    },
                    setSceneCaption: (data) => {
                        sceneCaptionManager.setCaption(data);
                        viewer.global.app.renderNextFrame = true;
                        return true;
                    },
                    setAtmosphereSettings: (settings) => {
                        sceneCaptionManager.setAtmosphere(settings);
                        viewer.global.app.renderNextFrame = true;
                        return true;
                    },
                    projectPoint,
                    releaseManualControl: () => {
                        manualControl.enabled = false;
                        manualControl.view = null;
                        return true;
                    }
                };
                try {
                    window.parent?.postMessage({
                        source: 'supersplat-viewer',
                        type: 'bridge-ready'
                    }, window.location.origin);
                }
                catch (error) {
                    console.warn('Failed to notify parent window that bridge is ready.', error);
                }
                waitForCameraManager();
            };
})();
