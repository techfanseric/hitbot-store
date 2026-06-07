'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TrialSceneProps {
  deviceX: number;
  deviceZ: number;
  onDeviceMove: (position: { x: number; z: number }) => void;
  interactive?: boolean;
}

export function TrialScene({
  deviceX,
  deviceZ,
  onDeviceMove,
  interactive = true,
}: TrialSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const deviceRef = useRef<THREE.Group | null>(null);
  const positionRef = useRef({ x: deviceX, z: deviceZ });
  const interactiveRef = useRef(interactive);

  useEffect(() => {
    positionRef.current = { x: deviceX, z: deviceZ };
    if (deviceRef.current) {
      deviceRef.current.position.set(deviceX, 0.18, deviceZ);
    }
  }, [deviceX, deviceZ]);

  useEffect(() => {
    interactiveRef.current = interactive;
    const canvas = hostRef.current?.querySelector('canvas');
    if (canvas) canvas.style.cursor = interactive ? 'grab' : 'default';
  }, [interactive]);

  useEffect(() => {
    const currentHost = hostRef.current;
    if (!currentHost) return;
    const hostElement: HTMLDivElement = currentHost;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f2f2f0');

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(2.8, 2.4, 3.4);
    camera.lookAt(0, 0.35, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cursor = interactiveRef.current ? 'grab' : 'default';
    hostElement.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight('#ffffff', '#d6d3cb', 1.8);
    scene.add(ambient);

    const key = new THREE.DirectionalLight('#ffffff', 2.4);
    key.position.set(2, 4, 2);
    key.castShadow = true;
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.05, 2.8),
      new THREE.MeshStandardMaterial({ color: '#e8e7e3', roughness: 0.7 }),
    );
    floor.receiveShadow = true;
    scene.add(floor);

    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.06, 0.06),
      new THREE.MeshStandardMaterial({ color: '#8b8a86', metalness: 0.2, roughness: 0.45 }),
    );
    rail.position.set(0, 0.16, -0.75);
    rail.castShadow = true;
    scene.add(rail);

    const arm = new THREE.Group();
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: '#d6d5d0',
      metalness: 0.25,
      roughness: 0.35,
    });
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: '#b24a32',
      metalness: 0.1,
      roughness: 0.45,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.18, 32), jointMaterial);
    base.castShadow = true;
    arm.add(base);
    const link1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.18), baseMaterial);
    link1.position.set(0, 0.55, 0);
    link1.rotation.z = -0.55;
    link1.castShadow = true;
    arm.add(link1);
    const link2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.16), baseMaterial);
    link2.position.set(0.55, 0.95, 0);
    link2.rotation.z = 0.8;
    link2.castShadow = true;
    arm.add(link2);
    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), jointMaterial);
    wrist.position.set(0.84, 0.72, 0);
    wrist.castShadow = true;
    arm.add(wrist);
    const gripper = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.12, 0.18),
      new THREE.MeshStandardMaterial({ color: '#30302f', roughness: 0.42 }),
    );
    gripper.position.set(1.08, 0.58, 0);
    gripper.castShadow = true;
    arm.add(gripper);
    arm.position.set(-0.85, 0.1, 0.15);
    scene.add(arm);

    const device = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.34, 0.34),
      new THREE.MeshStandardMaterial({ color: '#aeb4b6', metalness: 0.15, roughness: 0.38 }),
    );
    body.castShadow = true;
    device.add(body);
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.08, 0.28),
      new THREE.MeshStandardMaterial({ color: '#202124', roughness: 0.4 }),
    );
    cap.position.y = 0.21;
    cap.castShadow = true;
    device.add(cap);
    const accent = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.04, 0.34),
      new THREE.MeshStandardMaterial({ color: '#c8634d', roughness: 0.55 }),
    );
    accent.position.y = -0.19;
    device.add(accent);
    device.position.set(positionRef.current.x, 0.18, positionRef.current.z);
    scene.add(device);
    deviceRef.current = device;

    const ghost = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.02, 0.72),
      new THREE.MeshBasicMaterial({ color: '#bd1c22', transparent: true, opacity: 0.08 }),
    );
    ghost.position.set(0.6, 0.03, 0.2);
    scene.add(ghost);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.05);
    const target = new THREE.Vector3();
    let dragging = false;

    function resize() {
      const rect = hostElement.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }

    function setPointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function moveDevice(event: PointerEvent) {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, target);
      onDeviceMove({ x: target.x, z: target.z });
    }

    function handlePointerDown(event: PointerEvent) {
      if (!interactiveRef.current) return;
      dragging = true;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
      moveDevice(event);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragging) return;
      moveDevice(event);
    }

    function handlePointerUp(event: PointerEvent) {
      dragging = false;
      renderer.domElement.style.cursor = interactiveRef.current ? 'grab' : 'default';
      renderer.domElement.releasePointerCapture(event.pointerId);
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('resize', resize);
    resize();

    let frame = 0;
    let animationFrame = 0;
    function animate() {
      frame += 0.01;
      arm.rotation.y = Math.sin(frame) * 0.08;
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.dispose();
      hostElement.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [onDeviceMove]);

  return <div ref={hostRef} className="h-full min-h-[280px] w-full" />;
}
