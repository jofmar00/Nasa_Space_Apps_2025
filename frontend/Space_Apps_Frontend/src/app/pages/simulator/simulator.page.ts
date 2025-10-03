import { Component, ElementRef, AfterViewInit, ViewChild, signal } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AsteroidInfoPanel } from '../../components/asteroid-info-panel/asteroid-info-panel';

@Component({
  imports: [AsteroidInfoPanel],
  templateUrl: './simulator.page.html',
  styleUrl: './simulator.page.scss'
})
export class SimulatorPage implements AfterViewInit {
  @ViewChild('earthContainer', { static: false }) earthContainer!: ElementRef<HTMLDivElement>;

  protected readonly coordinates = signal<{lat: number, lng: number} | null>(null);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private earth!: THREE.Mesh;
  private clouds!: THREE.Mesh;
  private stars!: THREE.Mesh;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

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
    const geometry = new THREE.SphereGeometry(1, 64, 64);

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
    this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private onMouseClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.earth);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const point = intersection.point.normalize();

      // Convert 3D point to geographical coordinates
      // For a sphere at origin with radius 1:
      // x = cos(lat) * cos(lng)
      // y = sin(lat)
      // z = cos(lat) * sin(lng)

      // Calculate latitude (north-south): -90 to +90 degrees
      const lat = Math.asin(point.y) * (180 / Math.PI);

      // Calculate longitude (east-west): -180 to +180 degrees
      const lng = Math.atan2(point.z, point.x) * (180 / Math.PI);

      this.coordinates.set({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4))
      });
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

    this.renderer.render(this.scene, this.camera);
  }
}
