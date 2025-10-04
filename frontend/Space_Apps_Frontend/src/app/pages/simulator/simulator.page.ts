import { Component, ElementRef, AfterViewInit, ViewChild, signal, inject, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { AsteroidInfoPanel } from '../../components/asteroid-info-panel/asteroid-info-panel';
import { Asteroid } from '../../models/asteroid.model';
import { logCoordinates, pointToCoordinates, validateCoordinates, calculateDistance } from '../../utils/coordinate-utils';
import { AsteroidService } from '../../services/asteroid.service';
import { Router } from '@angular/router';

@Component({
  imports: [AsteroidInfoPanel],
  templateUrl: './simulator.page.html',
  styleUrl: './simulator.page.scss'
})
export class SimulatorPage implements AfterViewInit {
  @ViewChild('earthContainer', { static: false }) earthContainer!: ElementRef<HTMLDivElement>;

  protected readonly coordinates = signal<{lat: number, lng: number} | null>(null);
  protected readonly targetPoint = signal<{lat: number, lng: number, position: THREE.Vector3} | null>(null);
  protected readonly launchState = signal<'idle' | 'launching' | 'impacted'>('idle');

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private earth!: THREE.Mesh;
  private clouds!: THREE.Mesh;
  private stars!: THREE.Mesh;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private targetMarker?: THREE.Mesh;
  private lastClickTime = 0;
  private clickDebounceMs = 300;
  private flyingAsteroid?: THREE.Object3D;
  private animationProgress = 0;
  private animationDuration = 3000; // 3 seconds
  private animationStartTime = 0;
  private mouseDownPosition = { x: 0, y: 0 };
  private isDragging = false;
  private readonly textureRotationOffset = 180; // Earth texture is rotated 180 degrees
  private imageb64 = signal('')

  private readonly asteroidSservice = inject(AsteroidService)
  private readonly routeService = inject(Router)

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.createEarth();
    this.createClouds();
    this.createStarField();
    this.setupLighting();
    this.setupControls();
    this.setupEventListeners();
    this.animate();
  }

  private initThreeJS(): void {
    // Scene setup
    this.scene = new THREE.Scene();

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.earthContainer.nativeElement.clientWidth / this.earthContainer.nativeElement.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 3;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.earthContainer.nativeElement.clientWidth,
      this.earthContainer.nativeElement.clientHeight
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.earthContainer.nativeElement.appendChild(this.renderer.domElement);
  }

  private createEarth(): void {
    const geometry = new THREE.SphereGeometry(1, 64, 32);

    // Load textures
    const loader = new THREE.TextureLoader();
    const colorMap = loader.load('/Albedo.jpg');
    const bumpMap = loader.load('/Bump.jpg');

    const material = new THREE.MeshPhongMaterial({
      map: colorMap,
      bumpMap: bumpMap,
      bumpScale: 0.1,
    });

    this.earth = new THREE.Mesh(geometry, material);
    this.earth.castShadow = true;
    this.earth.receiveShadow = true;
    this.scene.add(this.earth);
  }

  private createClouds(): void {
    const geometry = new THREE.SphereGeometry(1.01, 64, 64);
    const loader = new THREE.TextureLoader();
    const cloudTexture = loader.load('/Clouds.png');

    const material = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
    });

    this.clouds = new THREE.Mesh(geometry, material);
    this.scene.add(this.clouds);
  }

  private createStarField(): void {
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    const loader = new THREE.TextureLoader();
    const starTexture = loader.load('/Gaia_EDR3_darkened.png');

    const material = new THREE.MeshBasicMaterial({
      map: starTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.3,
    });

    this.stars = new THREE.Mesh(geometry, material);
    this.scene.add(this.stars);
  }

  private setupLighting(): void {
    // Strong ambient light to illuminate all surfaces evenly
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Multiple directional lights from different angles for even coverage
    const light1 = new THREE.DirectionalLight(0xffffff, 0.4);
    light1.position.set(1, 1, 1);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.4);
    light2.position.set(-1, 1, -1);
    this.scene.add(light2);

    const light3 = new THREE.DirectionalLight(0xffffff, 0.3);
    light3.position.set(1, -1, -1);
    this.scene.add(light3);

    const light4 = new THREE.DirectionalLight(0xffffff, 0.3);
    light4.position.set(-1, -1, 1);
    this.scene.add(light4);
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Enable damping for smoother controls
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Set distance limits
    this.controls.minDistance = 1.5;  // Closest zoom
    this.controls.maxDistance = 10;   // Farthest zoom

    // Enable zoom, rotate, and pan
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.enablePan = true;

    // Set rotation speed
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 0.5;

    // Set target to center of Earth
    this.controls.target.set(0, 0, 0);
  }

  private setupEventListeners(): void {
    this.renderer.domElement.addEventListener('mousedown', (event) => this.onMouseDown(event));
    this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
    this.renderer.domElement.addEventListener('mouseup', (event) => this.onMouseUp(event));
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private onMouseDown(event: MouseEvent): void {
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
    this.isDragging = false;
  }

  private onMouseMove(event: MouseEvent): void {
    if (event.buttons === 1) { // Left mouse button is pressed
      const deltaX = Math.abs(event.clientX - this.mouseDownPosition.x);
      const deltaY = Math.abs(event.clientY - this.mouseDownPosition.y);

      // If moved more than 5 pixels, consider it a drag
      if (deltaX > 5 || deltaY > 5) {
        this.isDragging = true;
      }
    }
  }

  private onMouseUp(event: MouseEvent): void {
    // Only process as click if not dragging
    if (!this.isDragging) {
      this.onMouseClick(event);
    }
    this.isDragging = false;
  }

  private onMouseClick(event: MouseEvent): void {
    // Debounce to prevent double-click issues
    const now = Date.now();
    if (now - this.lastClickTime < this.clickDebounceMs) {
      return;
    }
    this.lastClickTime = now;

    // Don't allow clicks during launch
    if (this.launchState() === 'launching') {
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.earth);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const point = intersection.point.clone();
      console.log(intersection)

      // Calculate coordinates using utility functions with texture rotation offset
      const coords = pointToCoordinates(point, -9);
      let { lat, lng } = coords;
      console.log({ lat, lng })

      // Validate coordinates
      if (!validateCoordinates(lat, lng)) {
        console.warn('Invalid coordinates calculated:', { lat, lng });
        return;
      }

      // Round to reasonable precision
      lat = Number(lat.toFixed(6));
      lng = Number(lng.toFixed(6));

      this.coordinates.set({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4))
      });

      // Set target point and create/update marker
      this.targetPoint.set({
        lat,
        lng,
        position: point
      });

      this.createOrUpdateMarker(point);
    }
  }

  private createOrUpdateMarker(position: THREE.Vector3): void {
    // Remove existing marker
    if (this.targetMarker) {
      this.scene.remove(this.targetMarker);
      this.targetMarker.geometry.dispose();
      if (this.targetMarker.material instanceof THREE.Material) {
        this.targetMarker.material.dispose();
      }
    }

    // Create new marker
    const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xF44336,
      transparent: true,
      opacity: 0.9
    });

    this.targetMarker = new THREE.Mesh(markerGeometry, markerMaterial);

    // Position marker slightly above surface to make it visible
    const markerPosition = position.clone().normalize().multiplyScalar(1.015);
    this.targetMarker.position.copy(markerPosition);

    // Add pulsing animation
    this.targetMarker.userData['scale'] = 1;
    this.targetMarker.userData['pulseDirection'] = 1;

    this.scene.add(this.targetMarker);
  }

  private removeMarker(): void {
    if (this.targetMarker) {
      this.scene.remove(this.targetMarker);
      this.targetMarker.geometry.dispose();
      if (this.targetMarker.material instanceof THREE.Material) {
        this.targetMarker.material.dispose();
      }
      this.targetMarker = undefined;
    }
  }

  private onWindowResize(): void {
    const width = this.earthContainer.nativeElement.clientWidth;
    const height = this.earthContainer.nativeElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    // Update controls
    this.controls.update();

    // Rotate clouds slowly (Earth rotation stopped)
    this.clouds.rotation.y += 0.0005;

    // Animate marker pulsing
    if (this.targetMarker) {
      this.targetMarker.userData['scale'] += 0.02 * this.targetMarker.userData['pulseDirection'];
      if (this.targetMarker.userData['scale'] > 1.3) {
        this.targetMarker.userData['pulseDirection'] = -1;
      } else if (this.targetMarker.userData['scale'] < 1) {
        this.targetMarker.userData['pulseDirection'] = 1;
      }
      this.targetMarker.scale.setScalar(this.targetMarker.userData['scale']);
    }

    // Animate asteroid trajectory
    if (this.launchState() === 'launching' && this.flyingAsteroid) {
      this.updateAsteroidTrajectory();
    }

    this.renderer.render(this.scene, this.camera);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  protected async onLaunchAsteroid(asteroid: any) {
    const target = this.targetPoint();
    if (!target || this.launchState() === 'launching') {
      return;
    }
    const craterRadius = await this.asteroidSservice.getCraterRadius(asteroid.mass, asteroid.speed)
    
    if(craterRadius) {
      const buffer = await this.asteroidSservice.getCoordinatesImage(this.targetPoint()!.lat, this.targetPoint()!.lng, craterRadius*2)

      this.imageb64.set('data:image/png;base64,' + this.arrayBufferToBase64(buffer as ArrayBuffer));
    }

    logCoordinates(target.lat, target.lng, target.position, 'IMPACT TARGET');

    this.launchState.set('launching');
    this.loadAndLaunchAsteroid(asteroid, target.position);
  }

  private async loadAndLaunchAsteroid(asteroid: Asteroid, targetPosition: THREE.Vector3): Promise<void> {
    try {
      const response = await fetch(`/asteroids/${asteroid.name.toLowerCase()}.txt`);
      if (!response.ok) {
        throw new Error(`Failed to load asteroid model: ${asteroid.name}`);
      }

      const objData = await response.text();
      const loader = new OBJLoader();
      this.flyingAsteroid = loader.parse(objData);

      // Apply material
      this.flyingAsteroid.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshPhongMaterial({
            color: 0x806565,
            shininess: 30
          });
        }
      });

      // Calculate bounding box for proper scaling
      const box = new THREE.Box3().setFromObject(this.flyingAsteroid);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      // Scale asteroid appropriately (about 1/20th of Earth's size for visibility)
      const scale = 0.05 / maxDim;
      this.flyingAsteroid.scale.setScalar(scale);

      // Position asteroid at starting point (from camera position)
      // Get camera direction and place asteroid behind camera
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);

      // Get camera right vector (for left/right positioning)
      const cameraRight = new THREE.Vector3();
      cameraRight.crossVectors(this.camera.up, cameraDirection).normalize();

      // Start position: camera position + offset behind camera + offset to the left
      const startPosition = this.camera.position.clone()
        .add(cameraDirection.multiplyScalar(-0.5))  // Behind camera
        .add(cameraRight.multiplyScalar(1.5));       // To the left

      this.flyingAsteroid.position.copy(startPosition);

      // Store trajectory data
      this.flyingAsteroid.userData['startPosition'] = startPosition.clone();
      this.flyingAsteroid.userData['targetPosition'] = targetPosition.clone().normalize().multiplyScalar(1.0);
      this.flyingAsteroid.userData['rotationSpeed'] = new THREE.Vector3(
        Math.random() * 0.02 - 0.01,
        Math.random() * 0.02 - 0.01,
        Math.random() * 0.02 - 0.01
      );

      this.scene.add(this.flyingAsteroid);

      // Start animation
      this.animationStartTime = Date.now();
      this.animationProgress = 0;

    } catch (error) {
      console.error('Error loading asteroid:', error);
      this.launchState.set('idle');
    }
  }

  private updateAsteroidTrajectory(): void {
    if (!this.flyingAsteroid) return;

    const elapsed = Date.now() - this.animationStartTime;
    this.animationProgress = Math.min(elapsed / this.animationDuration, 1);

    // Ease-in-out function for smooth animation
    const easeProgress = this.animationProgress < 0.5
      ? 2 * this.animationProgress * this.animationProgress
      : 1 - Math.pow(-2 * this.animationProgress + 2, 2) / 2;

    const start = this.flyingAsteroid.userData['startPosition'];
    const target = this.flyingAsteroid.userData['targetPosition'];

    // Interpolate position
    this.flyingAsteroid.position.lerpVectors(start, target, easeProgress);

    // Tumbling rotation
    const rotSpeed = this.flyingAsteroid.userData['rotationSpeed'];
    this.flyingAsteroid.rotation.x += rotSpeed.x;
    this.flyingAsteroid.rotation.y += rotSpeed.y;
    this.flyingAsteroid.rotation.z += rotSpeed.z;

    // Check if animation is complete
    if (this.animationProgress >= 1) {
      this.handleImpact();
    }
  }

  private handleImpact(): void {
    // Log impact
    const target = this.targetPoint();
    if (target) {
      logCoordinates(target.lat, target.lng, target.position, 'IMPACT LOCATION');
    }

    // Remove flying asteroid
    if (this.flyingAsteroid) {
      this.scene.remove(this.flyingAsteroid);
      this.flyingAsteroid = undefined;
    }

    // Create impact flash
    this.createImpactFlash();

    // Reset state after a short delay
    setTimeout(() => {
      this.launchState.set('idle');
      this.removeMarker();
      this.targetPoint.set(null);

      if (this.imageb64()) {
        this.routeService.navigate(['/timeline'], { state: { b64: this.imageb64() } })
      }

    }, 1500);
  }

  private createImpactFlash(): void {
    const target = this.targetPoint();
    if (!target) return;

    // Create a brief flash at impact point
    const flashGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6600,
      transparent: true,
      opacity: 1
    });

    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    const flashPosition = target.position.clone().normalize().multiplyScalar(1.02);
    flash.position.copy(flashPosition);

    this.scene.add(flash);

    // Animate flash
    let flashScale = 1;
    let flashOpacity = 1;
    const flashInterval = setInterval(() => {
      flashScale += 0.1;
      flashOpacity -= 0.1;

      flash.scale.setScalar(flashScale);
      flashMaterial.opacity = flashOpacity;

      if (flashOpacity <= 0) {
        clearInterval(flashInterval);
        this.scene.remove(flash);
        flashGeometry.dispose();
        flashMaterial.dispose();
      }
    }, 50);
  }
}
