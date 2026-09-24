import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "../css/Canvas3D.css";

gsap.registerPlugin(ScrollTrigger);

const ATLAS_URL = "/models/bodyparts3d/atlas.json";
const DISPLAY_SYSTEMS = new Set(["skeletal", "muscular", "connective"]);
const SYSTEM_COLORS = {
  skeletal: "#dfd8c4",
  muscular: "#9f3f45",
  connective: "#d5b99c",
};

const ANATOMY_LIBRARY = {
  deltoid: {
    scientificName: "Musculus deltoideus",
    summary: "The deltoid forms the shoulder contour and helps lift, rotate, and stabilize the arm.",
    causes: ["Repetitive overhead loading", "Rapid increases in training volume", "Direct impact or muscular strain"],
    rehab: ["Pain-free pendulum movements", "Gentle isometric shoulder abduction", "Progressive external-rotation strengthening"],
  },
  biceps: {
    scientificName: "Musculus biceps brachii",
    summary: "The biceps crosses the shoulder and elbow, helping flex the elbow and rotate the forearm.",
    causes: ["Repeated lifting or pulling", "High-volume elbow flexion", "Sudden eccentric loading"],
    rehab: ["Gentle elbow range of motion", "Submaximal isometric curls", "Slow, progressive resistance work"],
  },
  triceps: {
    scientificName: "Musculus triceps brachii",
    summary: "The triceps is the primary elbow extensor and assists shoulder stability during pushing activity.",
    causes: ["Repeated pushing movements", "Heavy overhead extension", "Direct strain near the elbow attachment"],
    rehab: ["Comfortable elbow flexion and extension", "Low-load extension isometrics", "Progressive pressing tolerance"],
  },
  pectoralis: {
    scientificName: "Musculus pectoralis major",
    summary: "The pectoralis major moves the arm across the body and contributes to pressing and shoulder control.",
    causes: ["Heavy pressing or fly movements", "Forceful arm extension", "Sudden load at a stretched position"],
    rehab: ["Comfortable chest and shoulder mobility", "Gentle wall-based isometrics", "Gradual return to horizontal pressing"],
  },
  quadriceps: {
    scientificName: "Musculus quadriceps femoris",
    summary: "The quadriceps straightens the knee and controls load during walking, stairs, squatting, and landing.",
    causes: ["Sprinting or jumping load", "Rapid increases in squat volume", "Direct impact to the thigh"],
    rehab: ["Pain-free knee range of motion", "Quadriceps isometric holds", "Progressive squat and step loading"],
  },
  hamstring: {
    scientificName: "Hamstring muscle group",
    summary: "The hamstrings bend the knee, extend the hip, and control the leg during high-speed movement.",
    causes: ["High-speed running exposure", "Forceful hip flexion with knee extension", "Sudden acceleration or deceleration"],
    rehab: ["Comfortable hip and knee movement", "Submaximal bridge isometrics", "Progressive eccentric hamstring loading"],
  },
  patellar: {
    scientificName: "Ligamentum patellae",
    summary: "The patellar ligament connects the kneecap to the shin and transfers quadriceps force at the knee.",
    causes: ["Repeated jumping or landing", "Rapid changes in running load", "High-volume deep knee flexion"],
    rehab: ["Comfortable knee-extension isometrics", "Slow progressive squat loading", "Graded return to jumping volume"],
  },
  achilles: {
    scientificName: "Tendo calcaneus",
    summary: "The Achilles tendon connects the calf muscles to the heel and transfers force during walking and running.",
    causes: ["Rapid increases in running volume", "Repeated jumping", "Sudden high-force acceleration"],
    rehab: ["Comfortable ankle motion", "Calf isometric holds", "Progressive heel-raise loading"],
  },
};

const DEFAULTS = {
  skeletal: {
    scientificName: "Skeletal structure",
    summary: "This bone forms part of the body's supporting framework and provides protection or attachment for surrounding tissues.",
    causes: ["Direct impact", "Repetitive local loading", "Stress transferred from a nearby joint"],
    rehab: ["Protect painful movement initially", "Restore comfortable range gradually", "Seek assessment for persistent focal bone pain"],
  },
  muscular: {
    scientificName: "Skeletal muscle",
    summary: "This muscle contributes to movement, posture, and load control in its surrounding region.",
    causes: ["Repetitive or unfamiliar loading", "Sudden changes in activity volume", "Direct strain or impact"],
    rehab: ["Keep movement within a comfortable range", "Use gradual symptom-guided loading", "Seek guidance when symptoms persist"],
  },
  connective: {
    scientificName: "Connective-tissue structure",
    summary: "This structure helps connect, support, or stabilize nearby bones and muscles.",
    causes: ["Repeated tensile loading", "Joint stress or sudden force", "Rapid changes in activity volume"],
    rehab: ["Reduce aggravating load temporarily", "Maintain comfortable joint motion", "Progress resistance gradually"],
  },
};

function canonicalName(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function anatomyForPart(part) {
  const name = canonicalName(part?.name);
  const match = Object.keys(ANATOMY_LIBRARY).find((key) => name.includes(key));
  return match ? ANATOMY_LIBRARY[match] : DEFAULTS[part?.system] || DEFAULTS.muscular;
}

function layerAllows(mode, system) {
  if (mode === "both") return DISPLAY_SYSTEMS.has(system);
  if (mode === "skeleton") return system === "skeletal" || system === "connective";
  return system === "muscular" || system === "connective";
}

async function decodeGzip(response, expectedBytes) {
  if (!response.ok) throw new Error(`Anatomy download failed (${response.status}).`);
  const payload = await response.arrayBuffer();
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const isGzipPayload = signature[0] === 0x1f && signature[1] === 0x8b;
  if (!isGzipPayload) {
    if (payload.byteLength !== expectedBytes) throw new Error("An anatomy file was incomplete. Please reload.");
    return payload;
  }
  if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot unpack the anatomy model. Please use a current browser.");
  const stream = new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  if (buffer.byteLength !== expectedBytes) throw new Error("An anatomy file was incomplete. Please reload.");
  return buffer;
}

function createAtlasMaterial(system, visualTexture, textureWidth) {
  const material = new THREE.MeshStandardMaterial({
    color: SYSTEM_COLORS[system],
    roughness: system === "skeletal" ? 0.68 : 0.57,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.partVisuals = { value: visualTexture };
    shader.uniforms.visualWidth = { value: textureWidth };
    shader.vertexShader = `
      attribute float partIndex;
      uniform sampler2D partVisuals;
      uniform float visualWidth;
      varying vec4 anatomyVisual;
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       anatomyVisual = texture2D(partVisuals, vec2((partIndex + 0.5) / visualWidth, 0.5));`,
    );
    shader.fragmentShader = "varying vec4 anatomyVisual;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <clipping_planes_fragment>",
      `#include <clipping_planes_fragment>
       if (anatomyVisual.a < 0.01) discard;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
       diffuseColor.rgb *= mix(0.18, 1.0, anatomyVisual.a);
       if (anatomyVisual.b > 0.02) {
         vec3 lowPain = vec3(0.24, 0.67, 0.43);
         vec3 highPain = vec3(0.86, 0.18, 0.25);
         diffuseColor.rgb = mix(diffuseColor.rgb, mix(lowPain, highPain, anatomyVisual.b), 0.78);
       }
       if (anatomyVisual.g > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.30, 0.62, 1.0), 0.72);
       if (anatomyVisual.r > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.12, 0.18), 0.88);`,
    );
  };
  return material;
}

export default function BodyPartsCanvas({ selectedRegion, setSelectedRegion, setPainData, painData = {} }) {
  const stageRef = useRef(null);
  const hostRef = useRef(null);
  const tooltipRef = useRef(null);
  const infoPanelRef = useRef(null);
  const engineRef = useRef(null);
  const painDataRef = useRef(painData);
  const selectedPartRef = useRef(null);
  const hoveredPartRef = useRef(null);
  const focusPartRef = useRef(() => {});
  const selectPartRef = useRef(() => {});
  const layerRef = useRef("both");

  const [modelStatus, setModelStatus] = useState("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [layerMode, setLayerMode] = useState("both");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [availableParts, setAvailableParts] = useState([]);
  const selectedAnatomy = anatomyForPart(selectedPart);

  useEffect(() => {
    painDataRef.current = painData;
    engineRef.current?.refreshVisuals();
  }, [painData]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!selectedRegion) {
      selectedPartRef.current = null;
      hoveredPartRef.current = null;
      setSelectedPart(null);
      setPanelOpen(false);
      engine?.refreshVisuals();
      return;
    }
    if (!engine) return;
    const regionName = painData[selectedRegion]?.regionName;
    const part = engine.parts.find((candidate) => canonicalName(candidate.name) === canonicalName(regionName));
    if (part && part !== selectedPartRef.current) selectPartRef.current(part, { createSpot: false });
  }, [selectedRegion, painData]);

  useEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return undefined;

    let disposed = false;
    let frame = 0;
    let resizeFrame = 0;
    let pointerDown = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060912);
    scene.fog = new THREE.Fog(0x060912, 4.6, 10);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
    camera.position.set(0.55, 0.95, 4.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.setAttribute("aria-label", "Interactive adult human musculoskeletal anatomy");
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 0.55;
    controls.maxDistance = 8;
    controls.target.set(0, 0.9, 0);

    scene.add(new THREE.HemisphereLight(0xe9efff, 0x251017, 1.65));
    const key = new THREE.DirectionalLight(0xfff4e8, 3.6);
    key.position.set(-2.8, 4.5, 4);
    scene.add(key);
    const fill = new THREE.PointLight(0x5f8fff, 13, 9, 2);
    fill.position.set(3, 1.5, 2.4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff6b78, 2.1);
    rim.position.set(2.4, 2.4, -3);
    scene.add(rim);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(0.67, 0.72, 0.035, 96),
      new THREE.MeshStandardMaterial({ color: 0x141a27, roughness: 0.74, metalness: 0.15 }),
    );
    platform.position.y = -0.025;
    scene.add(platform);

    const root = new THREE.Group();
    scene.add(root);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const parts = [];
    const materials = [];
    let atlas;
    let visualData;
    let visualTexture;

    const resize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const width = Math.max(host.clientWidth, 1);
        const height = Math.max(host.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const animateCamera = (position, target, duration = 0.8) => {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      if (reduceMotion.matches) {
        camera.position.copy(position);
        controls.target.copy(target);
        controls.update();
        return;
      }
      gsap.to(camera.position, { ...position, duration, ease: "expo.out", overwrite: true, onUpdate: () => controls.update() });
      gsap.to(controls.target, { ...target, duration, ease: "expo.out", overwrite: true });
    };

    const frameBody = () => {
      const box = new THREE.Box3().setFromObject(root);
      if (box.isEmpty()) return;
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const target = center.clone().add(new THREE.Vector3(0, -0.11, 0));
      const distance = Math.max(size.y * 1.72, 3.8);
      animateCamera(target.clone().add(new THREE.Vector3(0.16, 0.04, 1).normalize().multiplyScalar(distance)), target, 1);
    };

    const focusPart = (part, view = 0) => {
      if (!part) return;
      const center = part.center;
      const size = part.bounds.getSize(new THREE.Vector3());
      const distance = Math.max(Math.max(size.x, size.y, size.z) * (view === 2 ? 4.2 : 5.3), 0.34);
      const angle = [0, 0.38, -0.42][view] || 0;
      const direction = new THREE.Vector3(Math.sin(angle), view === 2 ? 0.12 : 0.04, Math.cos(angle));
      animateCamera(center.clone().add(direction.multiplyScalar(distance)), center, 0.76);
    };
    focusPartRef.current = focusPart;

    const refreshVisuals = () => {
      if (!visualData || !visualTexture) return;
      const selected = selectedPartRef.current;
      const hovered = hoveredPartRef.current;
      const savedByName = new Map(Object.values(painDataRef.current).map((spot) => [canonicalName(spot.regionName), spot]));
      parts.forEach((part) => {
        const offset = part.index * 4;
        const isVisible = layerAllows(layerRef.current, part.system) || part === selected;
        const spot = savedByName.get(canonicalName(part.name));
        visualData[offset] = part === selected ? 255 : 0;
        visualData[offset + 1] = part === hovered ? 255 : 0;
        visualData[offset + 2] = spot ? Math.max(24, Math.round((spot.severity || 5) * 25.5)) : 0;
        visualData[offset + 3] = isVisible ? (selected && part !== selected ? 52 : 255) : 0;
      });
      visualTexture.needsUpdate = true;
    };

    const updatePartList = () => {
      setAvailableParts(parts.filter((part) => layerAllows(layerRef.current, part.system)).sort((a, b) => a.name.localeCompare(b.name)));
    };

    const selectPart = (part, { createSpot = true, intersection = null } = {}) => {
      if (!part) return;
      selectedPartRef.current = part;
      hoveredPartRef.current = null;
      setSelectedPart(part);
      setPanelOpen(true);
      refreshVisuals();
      requestAnimationFrame(() => focusPart(part));
      if (!createSpot) return;

      const existing = Object.entries(painDataRef.current).find(([, spot]) => canonicalName(spot.regionName) === canonicalName(part.name));
      if (existing) {
        setSelectedRegion(existing[0]);
        return;
      }
      const spotId = crypto.randomUUID();
      setPainData((previous) => ({
        ...previous,
        [spotId]: {
          regionName: part.name,
          severity: 5,
          painType: "",
          notes: "",
          startDate: "",
          frequency: "",
          clickPosition: intersection?.point ? `${intersection.point.x} ${intersection.point.y} ${intersection.point.z}` : null,
          anatomicalSystem: part.system,
        },
      }));
      setSelectedRegion(spotId);
    };
    selectPartRef.current = selectPart;

    const engine = {
      parts,
      camera,
      controls,
      root,
      refreshVisuals,
      setLayer(mode) {
        layerRef.current = mode;
        selectedPartRef.current = null;
        hoveredPartRef.current = null;
        refreshVisuals();
        updatePartList();
        setSelectedPart(null);
        setPanelOpen(false);
        setSelectedRegion(null);
        frameBody();
      },
    };
    engineRef.current = engine;

    const loadAtlas = async () => {
      try {
        const atlasResponse = await fetch(ATLAS_URL);
        if (!atlasResponse.ok) throw new Error("The anatomy index could not be loaded.");
        atlas = await atlasResponse.json();
        const textureWidth = THREE.MathUtils.ceilPowerOfTwo(atlas.parts.length);
        visualData = new Uint8Array(textureWidth * 4);
        visualTexture = new THREE.DataTexture(visualData, textureWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
        visualTexture.needsUpdate = true;

        const partByIndex = new Map(atlas.parts.map((part, index) => [index, { ...part, index }]));
        let completed = 0;
        let cursor = 0;

        const loadChunk = async (chunkIndex) => {
          const chunk = atlas.chunks[chunkIndex];
          // The neutral extension prevents static hosts from applying a second
          // Content-Encoding layer; decodeGzip handles the payload itself.
          const response = await fetch(`/models/bodyparts3d/body-${chunkIndex}.bin`);
          const buffer = await decodeGzip(response, chunk.bytes);
          if (disposed) return;
          const geometriesBySystem = new Map();

          atlas.parts.forEach((sourcePart, index) => {
            if (sourcePart.chunk !== chunkIndex || !DISPLAY_SYSTEMS.has(sourcePart.system)) return;
            const part = partByIndex.get(index);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(buffer, part.positions, part.vertexCount * 3), 3));
            geometry.setAttribute("normal", new THREE.BufferAttribute(new Int16Array(buffer, part.normals, part.vertexCount * 3), 3, true));
            geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, part.indices, part.indexCount), 1));
            geometry.setAttribute("partIndex", new THREE.BufferAttribute(new Float32Array(part.vertexCount).fill(index), 1));
            part.bounds = new THREE.Box3(new THREE.Vector3().fromArray(part.bounds[0]), new THREE.Vector3().fromArray(part.bounds[1]));
            part.center = part.bounds.getCenter(new THREE.Vector3());
            geometry.boundingBox = part.bounds.clone();
            geometry.computeBoundingSphere();
            part.geometry = geometry;
            part.picker = new THREE.Mesh(geometry);
            part.picker.matrixAutoUpdate = false;
            part.picker.updateMatrixWorld(true);
            parts.push(part);
            const list = geometriesBySystem.get(part.system) || [];
            list.push(geometry);
            geometriesBySystem.set(part.system, list);
          });

          geometriesBySystem.forEach((geometries, system) => {
            const merged = mergeGeometries(geometries, false);
            if (!merged) return;
            const material = createAtlasMaterial(system, visualTexture, textureWidth);
            materials.push(material);
            const mesh = new THREE.Mesh(merged, material);
            mesh.frustumCulled = false;
            root.add(mesh);
          });
          completed += 1;
          setLoadProgress(Math.round((completed / atlas.chunks.length) * 100));
        };

        await Promise.all(Array.from({ length: 3 }, async () => {
          while (cursor < atlas.chunks.length) {
            const index = cursor;
            cursor += 1;
            await loadChunk(index);
          }
        }));
        if (disposed) return;
        refreshVisuals();
        updatePartList();
        frameBody();
        setModelStatus("ready");
      } catch (error) {
        if (disposed) return;
        setLoadError(error instanceof Error ? error.message : "The anatomy model could not be loaded.");
        setModelStatus("error");
      }
    };
    loadAtlas();

    const updatePointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    };

    const hitTest = (event) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      let result = null;
      let nearest = Infinity;
      parts.forEach((part) => {
        const offset = part.index * 4;
        if (!visualData || visualData[offset + 3] === 0 || !raycaster.ray.intersectsBox(part.bounds)) return;
        const hit = raycaster.intersectObject(part.picker, false)[0];
        if (hit && hit.distance < nearest) {
          nearest = hit.distance;
          result = { ...hit, part };
        }
      });
      return result;
    };

    const hideTooltip = () => {
      if (!tooltipRef.current) return;
      tooltipRef.current.style.opacity = "0";
      tooltipRef.current.style.transform = "translate3d(0, 4px, 0)";
    };

    const onMove = (event) => {
      if (event.buttons) return hideTooltip();
      const hit = hitTest(event);
      const next = hit?.part || null;
      if (next !== hoveredPartRef.current) {
        hoveredPartRef.current = next;
        refreshVisuals();
        renderer.domElement.style.cursor = next ? "pointer" : "grab";
      }
      if (!next || !tooltipRef.current) return hideTooltip();
      const rect = stage.getBoundingClientRect();
      tooltipRef.current.textContent = next.name;
      tooltipRef.current.style.left = `${event.clientX - rect.left + 16}px`;
      tooltipRef.current.style.top = `${event.clientY - rect.top + 16}px`;
      tooltipRef.current.style.opacity = "1";
      tooltipRef.current.style.transform = "translate3d(0, 0, 0)";
    };

    const onClick = (event) => {
      if (pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return;
      const hit = hitTest(event);
      if (hit) selectPart(hit.part, { intersection: hit });
    };
    const onDown = (event) => { pointerDown = { x: event.clientX, y: event.clientY }; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerleave", hideTooltip);
    renderer.domElement.addEventListener("click", onClick);

    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      controls.dispose();
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      parts.forEach((part) => part.geometry?.dispose());
      root.traverse((object) => object.geometry?.dispose?.());
      materials.forEach((material) => material.dispose());
      visualTexture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      engineRef.current = null;
    };
  }, [setPainData, setSelectedRegion]);

  useLayoutEffect(() => {
    if (!panelOpen || !infoPanelRef.current) return undefined;
    const context = gsap.context(() => {
      gsap.utils.toArray(".anatomy-info__section").forEach((section, index) => {
        gsap.fromTo(section, { opacity: 0.4, y: 18, clipPath: "inset(0 0 15% 0)" }, {
          opacity: 1,
          y: 0,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: { trigger: section, scroller: infoPanelRef.current, start: "top 82%", toggleActions: "play none none reverse" },
        });
        ScrollTrigger.create({
          trigger: section,
          scroller: infoPanelRef.current,
          start: "top 56%",
          end: "bottom 38%",
          onEnter: () => focusPartRef.current(selectedPartRef.current, index),
          onEnterBack: () => focusPartRef.current(selectedPartRef.current, index),
        });
      });
    }, infoPanelRef);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => context.revert();
  }, [panelOpen, selectedPart]);

  const changeLayer = (mode) => {
    setLayerMode(mode);
    engineRef.current?.setLayer(mode);
  };

  const setView = (view) => {
    const engine = engineRef.current;
    if (!engine?.root) return;
    const box = new THREE.Box3().setFromObject(engine.root);
    const center = box.getCenter(new THREE.Vector3()).add(new THREE.Vector3(0, -0.11, 0));
    const size = box.getSize(new THREE.Vector3());
    const direction = {
      front: new THREE.Vector3(0, 0.03, 1),
      back: new THREE.Vector3(0, 0.03, -1),
      left: new THREE.Vector3(-1, 0.03, 0),
      right: new THREE.Vector3(1, 0.03, 0),
    }[view];
    const position = center.clone().add(direction.normalize().multiplyScalar(Math.max(size.y * 1.72, 3.8)));
    gsap.to(engine.camera.position, { ...position, duration: 0.75, ease: "expo.out", overwrite: true });
    gsap.to(engine.controls.target, { ...center, duration: 0.75, ease: "expo.out", overwrite: true });
  };

  const closeDetails = () => {
    selectedPartRef.current = null;
    setSelectedPart(null);
    setPanelOpen(false);
    setSelectedRegion(null);
    engineRef.current?.refreshVisuals();
  };

  const handlePartSelect = (event) => {
    const part = availableParts.find((candidate) => candidate.id === event.target.value);
    if (part) selectPartRef.current(part);
  };

  return (
    <main ref={stageRef} className={`anatomy-explorer ${panelOpen ? "anatomy-explorer--split" : ""}`}>
      <section className="anatomy-stage" aria-label="3D anatomy pain selector">
        <div ref={hostRef} className="anatomy-stage__canvas" />

        <div className="anatomy-stage__topline">
          <div className={`anatomy-stage__status ${modelStatus === "error" ? "is-error" : ""}`} aria-live="polite">
            <span className="anatomy-stage__status-dot" aria-hidden="true" />
            {modelStatus === "loading" && `Loading detailed anatomy · ${loadProgress}%`}
            {modelStatus === "ready" && `${availableParts.length} selectable structures`}
            {modelStatus === "error" && "Anatomy unavailable"}
          </div>

          <label className="anatomy-stage__region-picker">
            <span>Anatomical structure</span>
            <select value={selectedPart?.id || ""} onChange={handlePartSelect} disabled={modelStatus !== "ready"}>
              <option value="">Choose a structure</option>
              {availableParts.map((part) => <option key={part.id} value={part.id}>{part.name}</option>)}
            </select>
          </label>
        </div>

        <div className="anatomy-stage__layer-controls" aria-label="Anatomy layers">
          {[['skeleton', 'Skeleton'], ['muscles', 'Muscles'], ['both', 'Both']].map(([mode, label]) => (
            <button key={mode} type="button" className={layerMode === mode ? "is-active" : ""} onClick={() => changeLayer(mode)}>{label}</button>
          ))}
        </div>

        <div className="anatomy-stage__view-controls" aria-label="Model camera views">
          {[['front', 'Front'], ['back', 'Back'], ['left', 'Left'], ['right', 'Right']].map(([view, label]) => (
            <button key={view} type="button" onClick={() => setView(view)}>{label}</button>
          ))}
        </div>

        <p className="anatomy-stage__hint">Drag to rotate. Scroll to zoom. Select a structure to document pain.</p>
        {modelStatus === "error" && <p className="anatomy-stage__error">{loadError}</p>}
        <p className="anatomy-stage__attribution">BodyParts3D 4.0 · CC BY 4.0</p>
        <div ref={tooltipRef} className="anatomy-tooltip" role="status" />
      </section>

      {panelOpen && selectedPart && (
        <aside ref={infoPanelRef} className="anatomy-info" aria-label="Selected anatomy details">
          <header className="anatomy-info__header">
            <div>
              <p className="anatomy-info__context">{selectedPart.system} anatomy</p>
              <h2>{selectedPart.name}</h2>
            </div>
            <button type="button" className="anatomy-info__close" onClick={closeDetails}>Close</button>
          </header>
          <section className="anatomy-info__section">
            <p className="anatomy-info__label">Scientific context</p>
            <h3>{selectedAnatomy.scientificName}</h3>
            <p>{selectedAnatomy.summary}</p>
          </section>
          <section className="anatomy-info__section">
            <p className="anatomy-info__label">Common pain contributors</p>
            <h3>Patterns worth discussing</h3>
            <ul>{selectedAnatomy.causes.map((cause) => <li key={cause}>{cause}</li>)}</ul>
          </section>
          <section className="anatomy-info__section">
            <p className="anatomy-info__label">Movement ideas</p>
            <h3>General rehabilitation examples</h3>
            <ul>{selectedAnatomy.rehab.map((exercise) => <li key={exercise}>{exercise}</li>)}</ul>
            <p className="anatomy-info__disclaimer">Educational information only. It is not a diagnosis or an individualized treatment plan.</p>
          </section>
        </aside>
      )}
    </main>
  );
}
