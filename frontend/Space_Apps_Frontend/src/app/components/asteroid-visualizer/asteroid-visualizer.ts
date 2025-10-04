import { CommonModule } from '@angular/common';
import { Component, input, ElementRef, AfterViewInit, OnDestroy, effect, viewChild } from '@angular/core';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

@Component({
  selector: 'asteroid-visualizer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asteroid-visualizer.html',
  styleUrl: './asteroid-visualizer.scss'
})
export class AsteroidVisualizer implements AfterViewInit, OnDestroy {
  asteroidName = input.required<string>();

  canvasContainer = viewChild.required<ElementRef<HTMLDivElement>>('canvasContainer');

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private asteroid?: THREE.Object3D;
  private animationId?: number;
  private resizeHandler = this.onWindowResize.bind(this);

  loading = true;
  error = false;
  errorMessage = '';

  constructor() {
    effect(() => {
      const name = this.asteroidName();

      if (this.scene) {
        this.loadAsteroid(name);
      }
    });
  }

  ngAfterViewInit() {
    this.initThreeJS();
    this.loadAsteroid(this.asteroidName());
  }

  ngOnDestroy() {
    // Stop animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Remove event listeners
    window.removeEventListener('resize', this.resizeHandler);

    // Clean up Three.js objects
    if (this.asteroid) {
      this.asteroid.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.asteroid = undefined;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      const canvas = this.renderer.domElement;
      if (canvas && canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
      this.renderer = undefined;
    }

    // Clear scene
    if (this.scene) {
      this.scene.clear();
      this.scene = undefined;
    }

    this.camera = undefined;
  }

  private initThreeJS() {
    const container = this.canvasContainer().nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000);
    this.camera.position.set(0, 0, 1.5);
    this.camera.lookAt(0, 0, 0);

    // Renderer with transparent background
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x6666ff, 0.4);
    backLight.position.set(-5, -3, -5);
    this.scene.add(backLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(0, 5, 0);
    this.scene.add(fillLight);

    // Handle window resize
    window.addEventListener('resize', this.resizeHandler);
  }

  private onWindowResize() {
    if (!this.camera || !this.renderer) return;

    const container = this.canvasContainer().nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private async loadAsteroid(name: string) {
    if (!this.scene) return;

    this.loading = true;
    this.error = false;
    this.errorMessage = '';

    // Remove old asteroid if exists
    if (this.asteroid) {
      this.scene.remove(this.asteroid);
      this.asteroid = undefined;
    }

    try {
      const response = await fetch(`/asteroids/${name}.txt`);

      if (!response.ok) {
        throw new Error(`Asteroid "${name}" not found`);
      }

      const objData = await response.text();
      const loader = new OBJLoader();

      this.asteroid = loader.parse(objData);

      // Center and scale the asteroid
      const box = new THREE.Box3().setFromObject(this.asteroid);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the asteroid
      this.asteroid.position.x = -center.x;
      this.asteroid.position.y = -center.y + 0.1;
      this.asteroid.position.z = -center.z;

      // Scale to fit canvas nicely (target ~0.6 units)
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.7 / maxDim;
      this.asteroid.scale.setScalar(scale);

      // Apply material to all meshes
      this.asteroid.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshPhongMaterial({
            color: 0x806565,
            shininess: 30,
            flatShading: false,
            side: THREE.DoubleSide
          });
        }
      });

      this.scene.add(this.asteroid);
      this.loading = false;

      // Start animation if not already running
      if (!this.animationId) {
        this.animate();
      }
    } catch (err) {
      this.loading = false;
      this.error = true;
      this.errorMessage = err instanceof Error ? err.message : 'Failed to load asteroid';
      console.error('Error loading asteroid:', err);
    }
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    // Rotate asteroid slowly
    if (this.asteroid) {
      this.asteroid.rotation.y += 0.005;
      this.asteroid.rotation.x += 0.001;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
