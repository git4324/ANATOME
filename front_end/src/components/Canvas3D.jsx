import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "../css/Canvas3D.css";

gsap.registerPlugin(ScrollTrigger);

const MODEL_URL = "/models/zanatomy_split.glb";

// Map names from your custom GLTF to the canonical names used by the pain
// tester. Add one entry per exported mesh when its name differs.
const CUSTOM_GLTF_MESH_NAME_MAP = {
  // "Object_102": "deltoid_l",
  // "Biceps_Right_Mesh": "biceps_r",
  // "PatellarTendon.R": "patellar_tendon_r",
};

const ANATOMY_LIBRARY = {
  deltoid: {
    scientificName: "Musculus deltoideus",
    summary:
      "The deltoid forms the rounded contour of the shoulder and contributes to lifting, rotating, and stabilizing the arm.",
    causes: [
      "Repetitive overhead loading",
      "Rapid increases in training volume",
      "Direct impact or muscular strain",
    ],
    rehab: [
      "Pain-free pendulum movements",
      "Gentle isometric shoulder abduction",
      "Progressive external-rotation strengthening",
    ],
  },
  biceps: {
    scientificName: "Musculus biceps brachii",
    summary:
      "The biceps crosses the shoulder and elbow, helping flex the elbow and rotate the forearm while supporting shoulder movement.",
    causes: [
      "Repeated lifting or pulling",
      "High-volume elbow flexion",
      "Sudden eccentric loading",
    ],
    rehab: [
      "Gentle elbow range of motion",
      "Submaximal isometric curls",
      "Slow, progressive resistance work",
    ],
  },
  triceps: {
    scientificName: "Musculus triceps brachii",
    summary:
      "The triceps is the primary elbow extensor and assists with shoulder stability during pushing and overhead activity.",
    causes: [
      "Repeated pushing movements",
      "Heavy overhead extension",
      "Direct strain near the elbow attachment",
    ],
    rehab: [
      "Comfortable elbow flexion and extension",
      "Low-load extension isometrics",
      "Progressive pressing tolerance",
    ],
  },
  pectoralis: {
    scientificName: "Musculus pectoralis major",
    summary:
      "The pectoralis major moves the arm across the body and contributes to pressing, internal rotation, and shoulder control.",
    causes: [
      "Heavy pressing or fly movements",
      "Forceful arm extension",
      "Sudden load at a stretched position",
    ],
    rehab: [
      "Comfortable chest and shoulder mobility",
      "Gentle wall-based isometrics",
      "Gradual return to horizontal pressing",
    ],
  },
  abdominals: {
    scientificName: "Rectus abdominis",
    summary:
      "The abdominal wall supports trunk flexion, pressure regulation, and transfer of force between the upper and lower body.",
    causes: [
      "Sudden trunk rotation",
      "Repeated loaded flexion",
      "Forceful coughing or bracing",
    ],
    rehab: [
      "Relaxed diaphragmatic breathing",
      "Pain-free trunk bracing",
      "Progressive anti-rotation exercise",
    ],
  },
  lower_back: {
    scientificName: "Lumbar paraspinal musculature",
    summary:
      "The lumbar paraspinal muscles help extend and stabilize the spine during standing, lifting, and changes in posture.",
    causes: [
      "Prolonged static posture",
      "Unexpected lifting or rotation",
      "Rapid changes in activity volume",
    ],
    rehab: [
      "Frequent comfortable position changes",
      "Gentle trunk mobility",
      "Progressive hip and trunk endurance work",
    ],
  },
  gluteus: {
    scientificName: "Gluteal muscle group",
    summary:
      "The gluteal muscles extend, rotate, and stabilize the hip during walking, running, climbing, and single-leg balance.",
    causes: [
      "Rapid increases in running volume",
      "Prolonged compression while sitting",
      "Repeated single-leg loading",
    ],
    rehab: [
      "Comfortable hip range of motion",
      "Low-load bridge variations",
      "Progressive single-leg stability work",
    ],
  },
  quadriceps: {
    scientificName: "Musculus quadriceps femoris",
    summary:
      "The quadriceps group straightens the knee and controls load absorption during walking, stairs, squatting, and landing.",
    causes: [
      "Sprinting or jumping load",
      "Rapid increases in squat volume",
      "Direct impact to the thigh",
    ],
    rehab: [
      "Pain-free knee range of motion",
      "Quadriceps isometric holds",
      "Progressive squat and step loading",
    ],
  },
  hamstring: {
    scientificName: "Hamstring muscle group",
    summary:
      "The hamstrings bend the knee, extend the hip, and control the leg during running and other high-speed movements.",
    causes: [
      "High-speed running exposure",
      "Forceful hip flexion with knee extension",
      "Sudden acceleration or deceleration",
    ],
    rehab: [
      "Comfortable hip and knee movement",
      "Submaximal bridge isometrics",
      "Progressive eccentric hamstring loading",
    ],
  },
  patellar_tendon: {
    scientificName: "Ligamentum patellae",
    summary:
      "The patellar tendon connects the kneecap to the shin and transfers quadriceps force during knee extension and landing.",
    causes: [
      "Repeated jumping or landing",
      "Rapid changes in running load",
      "High-volume deep knee flexion",
    ],
    rehab: [
      "Comfortable knee-extension isometrics",
      "Slow progressive squat loading",
      "Graded return to jumping volume",
    ],
  },
  calf: {
    scientificName: "Triceps surae muscle group",
    summary:
      "The calf complex produces ankle plantar flexion and helps control forward movement during walking, running, and jumping.",
    causes: [
      "Rapid acceleration or sprinting",
      "Increased hill or jumping volume",
      "Sudden ankle dorsiflexion under load",
    ],
    rehab: [
      "Comfortable ankle range of motion",
      "Double-leg calf isometrics",
      "Progressive calf raises and walking load",
    ],
  },
  forearm: {
    scientificName: "Antebrachial muscle group",
    summary:
      "The forearm muscles coordinate wrist, hand, and finger movement while stabilizing the wrist during gripping tasks.",
    causes: [
      "Repetitive gripping",
      "Sustained wrist positioning",
      "Rapid increases in racquet or lifting load",
    ],
    rehab: [
      "Gentle wrist range of motion",
      "Low-load grip isometrics",
      "Progressive wrist flexion and extension",
    ],
  },
};

const DEFAULT_ANATOMY = {
  scientificName: "Regional musculoskeletal anatomy",
  summary:
    "This selected structure contributes to movement and load transfer in the surrounding region.",
  causes: [
    "Repetitive or unfamiliar loading",
    "Sudden changes in activity volume",
    "Direct strain or impact",
  ],
  rehab: [
    "Keep movement within a comfortable range",
    "Use gradual, symptom-guided loading",
    "Seek individualized guidance when symptoms persist",
  ],
};

function canonicalMeshName(name = "") {
  const mappedName = CUSTOM_GLTF_MESH_NAME_MAP[name] || name;
  return mappedName
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[.\s-]+/g, "_")
    .replace(/_+mesh|mesh_+/gi, "")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function displayMeshName(name = "") {
  return canonicalMeshName(name)
    .replace(/_(l|left)$/i, " — Left")
    .replace(/_(r|right)$/i, " — Right")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function anatomyForMesh(name = "") {
  const canonicalName = canonicalMeshName(name);
  const key = Object.keys(ANATOMY_LIBRARY).find((entry) =>
    canonicalName.includes(entry),
  );
  return key ? ANATOMY_LIBRARY[key] : DEFAULT_ANATOMY;
}

function makeMaterial(color, roughness = 0.58, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
}

function buildFallbackAnatomy() {
  const group = new THREE.Group();
  group.name = "procedural_anatomy_fallback";

  const muscleColor = 0x8f2635;
  const deepMuscleColor = 0x6e1f2b;
  const tendonColor = 0xd2b69e;

  const addMesh = (name, geometry, position, scale, color = muscleColor) => {
    const mesh = new THREE.Mesh(geometry, makeMaterial(color));
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  const capsule = (radius, length) =>
    new THREE.CapsuleGeometry(radius, length, 10, 24);
  const sphere = () => new THREE.SphereGeometry(1, 32, 24);

  addMesh("cranium", sphere(), [0, 3.08, 0], [0.46, 0.58, 0.44], 0x9a4a4f);
  addMesh("cervical_region", capsule(0.2, 0.22), [0, 2.48, 0], [1, 1, 1]);
  addMesh("pectoralis_l", sphere(), [-0.37, 1.86, 0.2], [0.5, 0.58, 0.3]);
  addMesh("pectoralis_r", sphere(), [0.37, 1.86, 0.2], [0.5, 0.58, 0.3]);
  addMesh("abdominals", capsule(0.47, 0.8), [0, 0.92, 0.04], [1, 1, 0.62], deepMuscleColor);
  addMesh("lower_back", capsule(0.43, 0.78), [0, 0.94, -0.25], [1, 1, 0.56], deepMuscleColor);
  addMesh("gluteus_l", sphere(), [-0.3, 0.13, -0.13], [0.48, 0.48, 0.42]);
  addMesh("gluteus_r", sphere(), [0.3, 0.13, -0.13], [0.48, 0.48, 0.42]);

  [-1, 1].forEach((side) => {
    const suffix = side < 0 ? "l" : "r";
    addMesh(`deltoid_${suffix}`, sphere(), [side * 0.82, 1.95, 0], [0.33, 0.38, 0.34]);
    addMesh(`biceps_${suffix}`, capsule(0.18, 0.62), [side * 1.02, 1.32, 0.11], [1, 1, 0.92]);
    addMesh(`triceps_${suffix}`, capsule(0.15, 0.64), [side * 1.04, 1.31, -0.14], [1, 1, 0.9], deepMuscleColor);
    addMesh(`forearm_${suffix}`, capsule(0.14, 0.72), [side * 1.13, 0.5, 0], [0.9, 1, 0.84]);
    addMesh(`quadriceps_${suffix}`, capsule(0.27, 0.92), [side * 0.34, -0.65, 0.08], [1, 1, 0.96]);
    addMesh(`hamstring_${suffix}`, capsule(0.24, 0.92), [side * 0.34, -0.66, -0.18], [1, 1, 0.9], deepMuscleColor);
    addMesh(`patellar_tendon_${suffix}`, capsule(0.105, 0.22), [side * 0.34, -1.4, 0.1], [1, 1, 0.82], tendonColor);
    addMesh(`calf_${suffix}`, capsule(0.21, 0.86), [side * 0.34, -2.02, -0.04], [1, 1, 0.92]);
    addMesh(`achilles_tendon_${suffix}`, capsule(0.075, 0.34), [side * 0.34, -2.66, -0.13], [1, 1, 0.78], tendonColor);
  });

  return group;
}

function materialList(mesh) {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function captureMaterialState(mesh) {
  mesh.material = Array.isArray(mesh.material)
    ? mesh.material.map((material) => material.clone())
    : mesh.material.clone();

  mesh.userData.materialState = materialList(mesh).map((material) => ({
    color: material.color?.clone(),
    emissive: material.emissive?.clone(),
    emissiveIntensity: material.emissiveIntensity ?? 0,
    opacity: material.opacity,
    transparent: material.transparent,
    depthWrite: material.depthWrite,
  }));
}

function restoreMaterial(mesh) {
  materialList(mesh).forEach((material, index) => {
    const state = mesh.userData.materialState?.[index];
    if (!state) return;
    if (state.color && material.color) material.color.copy(state.color);
    if (state.emissive && material.emissive) material.emissive.copy(state.emissive);
    material.emissiveIntensity = state.emissiveIntensity;
    material.opacity = state.opacity;
    material.transparent = state.transparent;
    material.depthWrite = state.depthWrite;
  });
}

function setMeshVisual(mesh, state, severity = 5) {
  restoreMaterial(mesh);

  materialList(mesh).forEach((material) => {
    if (state === "dimmed") {
      material.transparent = true;
      material.opacity = 0.16;
      material.depthWrite = false;
      if (material.color) material.color.multiplyScalar(0.34);
    }

    if (state === "hovered") {
      if (material.emissive) material.emissive.set(0x5c9dff);
      material.emissiveIntensity = 0.42;
    }

    if (state === "saved") {
      const savedColor = severity <= 3 ? 0x3ca86d : severity <= 6 ? 0xd58a2a : 0xcf3d4d;
      if (material.color) material.color.set(savedColor);
      if (material.emissive) material.emissive.set(savedColor).multiplyScalar(0.18);
      material.emissiveIntensity = 0.28;
    }

    if (state === "selected") {
      if (material.color) material.color.set(0xd73f4d);
      if (material.emissive) material.emissive.set(0x7d111d);
      material.emissiveIntensity = 0.62;
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;
    }

    material.needsUpdate = true;
  });
}

export default function Canvas3D({
  selectedRegion,
  setSelectedRegion,
  setPainData,
  painData = {},
}) {
  const stageRef = useRef(null);
  const canvasHostRef = useRef(null);
  const tooltipRef = useRef(null);
  const infoPanelRef = useRef(null);
  const threeRef = useRef(null);
  const painDataRef = useRef(painData);
  const selectedMeshRef = useRef(null);
  const hoveredMeshRef = useRef(null);
  const focusMeshRef = useRef(() => {});
  const selectMeshRef = useRef(() => {});

  const [modelStatus, setModelStatus] = useState("loading");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [availableParts, setAvailableParts] = useState([]);

  const selectedAnatomy = anatomyForMesh(selectedName);

  useEffect(() => {
    painDataRef.current = painData;

    const state = threeRef.current;
    if (!state) return;

    state.clickableMeshes.forEach((mesh) => {
      const savedSpot = Object.values(painData).find(
        (spot) => canonicalMeshName(spot.regionName) === canonicalMeshName(mesh.userData.anatomyName),
      );

      if (mesh === selectedMeshRef.current) {
        setMeshVisual(mesh, "selected");
      } else if (selectedMeshRef.current) {
        setMeshVisual(mesh, "dimmed");
      } else if (mesh === hoveredMeshRef.current) {
        setMeshVisual(mesh, "hovered");
      } else if (savedSpot) {
        setMeshVisual(mesh, "saved", savedSpot.severity);
      } else {
        restoreMaterial(mesh);
      }
    });
  }, [painData]);

  useEffect(() => {
    if (!selectedRegion) {
      setPanelOpen(false);
      selectedMeshRef.current = null;
      const state = threeRef.current;
      state?.clickableMeshes.forEach((mesh) => restoreMaterial(mesh));
      return;
    }

    const regionName = painData[selectedRegion]?.regionName;
    const state = threeRef.current;
    if (!regionName || !state) return;

    const matchingMesh = state.clickableMeshes.find(
      (mesh) => canonicalMeshName(mesh.userData.anatomyName) === canonicalMeshName(regionName),
    );

    if (matchingMesh && matchingMesh !== selectedMeshRef.current) {
      selectMeshRef.current(matchingMesh, { createSpot: false });
    }
  }, [selectedRegion, painData]);

  useEffect(() => {
    const host = canvasHostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060912);
    scene.fog = new THREE.Fog(0x060912, 9, 19);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 100);
    camera.position.set(0, 1.1, 10.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute("aria-label", "Interactive 3D human anatomy model");
    renderer.domElement.setAttribute("role", "img");
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 15;
    controls.target.set(0, 0.25, 0);

    scene.add(new THREE.HemisphereLight(0xcad8ff, 0x160b10, 1.45));

    const keyLight = new THREE.DirectionalLight(0xfff2ea, 4.2);
    keyLight.position.set(4.5, 7, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x668dff, 24, 16, 2);
    fillLight.position.set(-4.5, 2.2, 4.2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xff566d, 18, 14, 2);
    rimLight.position.set(3.6, 1, -4.4);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.8, 72),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.34 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.02;
    floor.receiveShadow = true;
    scene.add(floor);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clickableMeshes = [];
    let modelRoot = null;
    let animationFrame = 0;
    let resizeFrame = 0;
    let renderedWidth = 0;
    let renderedHeight = 0;
    let pointerDownPosition = null;
    let disposed = false;

    const state = {
      scene,
      camera,
      renderer,
      controls,
      clickableMeshes,
      get modelRoot() {
        return modelRoot;
      },
      reduceMotion,
    };
    threeRef.current = state;

    const resize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const width = Math.max(host.clientWidth, 1);
        const height = Math.max(host.clientHeight, 1);
        if (width === renderedWidth && height === renderedHeight) return;
        renderedWidth = width;
        renderedHeight = height;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const animateCamera = (position, target, duration = 0.78) => {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);

      if (reduceMotion.matches) {
        camera.position.copy(position);
        controls.target.copy(target);
        controls.update();
        return;
      }

      gsap.to(camera.position, {
        x: position.x,
        y: position.y,
        z: position.z,
        duration,
        ease: "expo.out",
        overwrite: true,
        onUpdate: () => controls.update(),
      });
      gsap.to(controls.target, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration,
        ease: "expo.out",
        overwrite: true,
      });
    };

    const frameObject = (object, distanceMultiplier = 1.35) => {
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z, 0.5);
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const distance = (maxDimension / (2 * Math.tan(fov / 2))) * distanceMultiplier;
      const direction = new THREE.Vector3(0, 0.08, 1).normalize();
      animateCamera(center.clone().add(direction.multiplyScalar(distance)), center, 0.9);
    };

    const focusMesh = (mesh, view = 0) => {
      if (!mesh) return;
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z, 0.35);
      const distance = Math.max(maxDimension * (view === 2 ? 4.2 : 5.1), 2.15);
      const angles = [0, 0.32, -0.34];
      const angle = angles[view] ?? 0;
      const direction = new THREE.Vector3(Math.sin(angle), view === 2 ? 0.12 : 0.04, Math.cos(angle));
      animateCamera(center.clone().add(direction.multiplyScalar(distance)), center, 0.72);
    };
    focusMeshRef.current = focusMesh;

    const refreshVisuals = () => {
      clickableMeshes.forEach((mesh) => {
        const savedSpot = Object.values(painDataRef.current).find(
          (spot) => canonicalMeshName(spot.regionName) === canonicalMeshName(mesh.userData.anatomyName),
        );

        if (mesh === selectedMeshRef.current) setMeshVisual(mesh, "selected");
        else if (selectedMeshRef.current) setMeshVisual(mesh, "dimmed");
        else if (mesh === hoveredMeshRef.current) setMeshVisual(mesh, "hovered");
        else if (savedSpot) setMeshVisual(mesh, "saved", savedSpot.severity);
        else restoreMaterial(mesh);
      });
    };

    const selectMesh = (mesh, { createSpot = true, intersection = null } = {}) => {
      if (!mesh) return;

      const anatomyName = mesh.userData.anatomyName || mesh.name;
      selectedMeshRef.current = mesh;
      hoveredMeshRef.current = null;
      setSelectedName(anatomyName);
      setPanelOpen(true);
      refreshVisuals();
      requestAnimationFrame(() => focusMesh(mesh, 0));

      if (!createSpot) return;

      const existingEntry = Object.entries(painDataRef.current).find(
        ([, spot]) => canonicalMeshName(spot.regionName) === canonicalMeshName(anatomyName),
      );

      if (existingEntry) {
        setSelectedRegion(existingEntry[0]);
        return;
      }

      const spotId = crypto.randomUUID();
      let clickNormal = null;

      if (intersection?.face?.normal) {
        const normal = intersection.face.normal
          .clone()
          .transformDirection(mesh.matrixWorld)
          .normalize();
        clickNormal = `${normal.x} ${normal.y} ${normal.z}`;
      }

      setPainData((previous) => ({
        ...previous,
        [spotId]: {
          regionName: anatomyName,
          severity: 5,
          painType: "",
          notes: "",
          startDate: "",
          frequency: "",
          clickPosition: intersection?.point
            ? `${intersection.point.x} ${intersection.point.y} ${intersection.point.z}`
            : null,
          clickNormal,
        },
      }));
      setSelectedRegion(spotId);
    };
    selectMeshRef.current = selectMesh;

    const prepareModel = (root) => {
      modelRoot = root;
      clickableMeshes.length = 0;

      root.traverse((child) => {
        if (!child.isMesh || !child.material) return;

        const sourceName = child.name || child.parent?.name || "anatomy_region";
        child.userData.anatomyName =
          CUSTOM_GLTF_MESH_NAME_MAP[sourceName] || sourceName;
        child.castShadow = true;
        child.receiveShadow = true;
        captureMaterialState(child);
        clickableMeshes.push(child);
      });

      scene.add(root);
      setAvailableParts(
        clickableMeshes
          .map((mesh) => mesh.userData.anatomyName)
          .filter((name, index, names) => names.indexOf(name) === index)
          .sort((a, b) => displayMeshName(a).localeCompare(displayMeshName(b))),
      );
      frameObject(root, 1.18);
    };

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        prepareModel(gltf.scene);
        setModelStatus("ready");
      },
      undefined,
      () => {
        if (disposed) return;
        const fallback = buildFallbackAnatomy();
        prepareModel(fallback);
        setModelStatus("fallback");
      },
    );

    const updatePointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      return rect;
    };

    const hitTest = (event) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(clickableMeshes, false)[0] || null;
    };

    const hideTooltip = () => {
      if (!tooltipRef.current) return;
      tooltipRef.current.style.opacity = "0";
      tooltipRef.current.style.transform = "translate3d(0, 4px, 0)";
    };

    const handlePointerMove = (event) => {
      const intersection = hitTest(event);
      const nextHovered = intersection?.object || null;

      if (nextHovered !== hoveredMeshRef.current) {
        hoveredMeshRef.current = nextHovered;
        refreshVisuals();
        renderer.domElement.style.cursor = nextHovered ? "pointer" : "grab";
      }

      if (!nextHovered || !tooltipRef.current) {
        hideTooltip();
        return;
      }

      const stageRect = stage.getBoundingClientRect();
      tooltipRef.current.textContent = displayMeshName(nextHovered.userData.anatomyName);
      tooltipRef.current.style.left = `${event.clientX - stageRect.left + 16}px`;
      tooltipRef.current.style.top = `${event.clientY - stageRect.top + 16}px`;
      tooltipRef.current.style.opacity = "1";
      tooltipRef.current.style.transform = "translate3d(0, 0, 0)";
    };

    const handleClick = (event) => {
      if (
        pointerDownPosition &&
        Math.hypot(
          event.clientX - pointerDownPosition.x,
          event.clientY - pointerDownPosition.y,
        ) > 5
      ) {
        return;
      }

      const intersection = hitTest(event);
      if (intersection) selectMesh(intersection.object, { intersection });
    };

    const handlePointerDown = (event) => {
      pointerDownPosition = { x: event.clientX, y: event.clientY };
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", hideTooltip);
    renderer.domElement.addEventListener("click", handleClick);

    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerleave", hideTooltip);
      renderer.domElement.removeEventListener("click", handleClick);
      controls.dispose();
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);

      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (object.material) {
          materialList(object).forEach((material) => material.dispose?.());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      threeRef.current = null;
    };
  }, [setPainData, setSelectedRegion]);

  useLayoutEffect(() => {
    if (!panelOpen || !infoPanelRef.current) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const context = gsap.context(() => {
      const sections = gsap.utils.toArray(".anatomy-info__section");

      if (!reduceMotion) {
        gsap.fromTo(
          ".anatomy-info__header",
          { opacity: 0, y: 12, filter: "blur(4px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.42, ease: "power3.out" },
        );
      }

      sections.forEach((section, index) => {
        if (!reduceMotion) {
          gsap.fromTo(
            section,
            { opacity: 0.42, y: 18, clipPath: "inset(0 0 16% 0)" },
            {
              opacity: 1,
              y: 0,
              clipPath: "inset(0 0 0% 0)",
              duration: 0.5,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section,
                scroller: infoPanelRef.current,
                start: "top 82%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        ScrollTrigger.create({
          trigger: section,
          scroller: infoPanelRef.current,
          start: "top 55%",
          end: "bottom 38%",
          onEnter: () => focusMeshRef.current(selectedMeshRef.current, index),
          onEnterBack: () => focusMeshRef.current(selectedMeshRef.current, index),
        });
      });
    }, infoPanelRef);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => context.revert();
  }, [panelOpen, selectedName]);

  const setView = (view) => {
    const state = threeRef.current;
    if (!state?.modelRoot) return;

    if (selectedMeshRef.current) {
      const viewIndex = view === "left" ? 1 : view === "right" ? 2 : 0;
      focusMeshRef.current(selectedMeshRef.current, viewIndex);
      return;
    }

    const box = new THREE.Box3().setFromObject(state.modelRoot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const distance = Math.max(size.y * 1.35, 7);
    const direction = {
      front: new THREE.Vector3(0, 0.06, 1),
      back: new THREE.Vector3(0, 0.06, -1),
      left: new THREE.Vector3(-1, 0.06, 0),
      right: new THREE.Vector3(1, 0.06, 0),
    }[view];

    const targetPosition = center.clone().add(direction.normalize().multiplyScalar(distance));
    const duration = state.reduceMotion.matches ? 0 : 0.72;
    gsap.to(state.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration,
      ease: "expo.out",
      overwrite: true,
    });
    gsap.to(state.controls.target, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration,
      ease: "expo.out",
      overwrite: true,
    });
  };

  const closeDetails = () => {
    setPanelOpen(false);
    setSelectedName("");
    selectedMeshRef.current = null;
    setSelectedRegion(null);
  };

  const handleRegionSelect = (event) => {
    const anatomyName = event.target.value;
    const mesh = threeRef.current?.clickableMeshes.find(
      (candidate) => candidate.userData.anatomyName === anatomyName,
    );
    if (mesh) selectMeshRef.current(mesh);
  };

  return (
    <main
      ref={stageRef}
      className={`anatomy-explorer ${panelOpen ? "anatomy-explorer--split" : ""}`}
    >
      <section className="anatomy-stage" aria-label="3D anatomy pain selector">
        <div ref={canvasHostRef} className="anatomy-stage__canvas" />

        <div className="anatomy-stage__topline">
          <div className="anatomy-stage__status" aria-live="polite">
            <span className="anatomy-stage__status-dot" aria-hidden="true" />
            {modelStatus === "loading" && "Loading anatomy"}
            {modelStatus === "ready" && "Interactive anatomy"}
            {modelStatus === "fallback" && "Interactive fallback model"}
          </div>

          <label className="anatomy-stage__region-picker">
            <span>Body region</span>
            <select value={selectedName} onChange={handleRegionSelect}>
              <option value="">Choose a region</option>
              {availableParts.map((part) => (
                <option key={part} value={part}>
                  {displayMeshName(part)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="anatomy-stage__view-controls" aria-label="Model camera views">
          {[
            ["front", "Front"],
            ["back", "Back"],
            ["left", "Left"],
            ["right", "Right"],
          ].map(([view, label]) => (
            <button key={view} type="button" onClick={() => setView(view)}>
              {label}
            </button>
          ))}
        </div>

        <p className="anatomy-stage__hint">
          Drag to rotate. Scroll to zoom. Select a muscle or tendon to document pain.
        </p>

        {modelStatus === "fallback" && (
          <p className="anatomy-stage__fallback-note">
            The source GLB is unavailable, so a built-in anatomical test model is shown.
          </p>
        )}

        <div ref={tooltipRef} className="anatomy-tooltip" role="status" />
      </section>

      {panelOpen && (
        <aside ref={infoPanelRef} className="anatomy-info" aria-label="Selected anatomy details">
          <header className="anatomy-info__header">
            <div>
              <p className="anatomy-info__context">Selected anatomy</p>
              <h2>{displayMeshName(selectedName)}</h2>
            </div>
            <button type="button" className="anatomy-info__close" onClick={closeDetails}>
              Close
            </button>
          </header>

          <section className="anatomy-info__section">
            <p className="anatomy-info__label">Scientific name</p>
            <h3>{selectedAnatomy.scientificName}</h3>
            <p>{selectedAnatomy.summary}</p>
          </section>

          <section className="anatomy-info__section">
            <p className="anatomy-info__label">Common pain contributors</p>
            <h3>Patterns worth discussing</h3>
            <ul>
              {selectedAnatomy.causes.map((cause) => (
                <li key={cause}>{cause}</li>
              ))}
            </ul>
          </section>

          <section className="anatomy-info__section">
            <p className="anatomy-info__label">Movement ideas</p>
            <h3>General rehabilitation examples</h3>
            <ul>
              {selectedAnatomy.rehab.map((exercise) => (
                <li key={exercise}>{exercise}</li>
              ))}
            </ul>
            <p className="anatomy-info__disclaimer">
              Educational information only. It is not a diagnosis or an individualized treatment plan.
            </p>
          </section>
        </aside>
      )}
    </main>
  );
}
