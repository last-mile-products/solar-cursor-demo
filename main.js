import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Constants for simulation
const EARTH_YEAR = 365; // Earth days in a year
const TIME_SCALE = {
  MIN: 0.1,
  DEFAULT: 1,
  MAX: 10
};

// Planet data with real-ish proportions (not to actual scale)
const PLANETS = [
  {
    name: 'Mercury',
    radius: 0.38, // Relative to Earth
    distance: 5.8, // Distance from sun in AU (Astronomical Units)
    color: 0xaaaaaa,
    yearLength: 0.24 * EARTH_YEAR, // Mercury year in Earth days
    rotationSpeed: 0.017 // Rotation speed
  },
  {
    name: 'Venus',
    radius: 0.95,
    distance: 10.8,
    color: 0xe39e1c,
    yearLength: 0.62 * EARTH_YEAR,
    rotationSpeed: 0.004
  },
  {
    name: 'Earth',
    radius: 1,
    distance: 15,
    color: 0x2277ff,
    yearLength: EARTH_YEAR,
    rotationSpeed: 0.01
  },
  {
    name: 'Mars',
    radius: 0.53,
    distance: 22.8,
    color: 0xc1440e,
    yearLength: 1.88 * EARTH_YEAR,
    rotationSpeed: 0.01
  },
  {
    name: 'Jupiter',
    radius: 11.2,
    distance: 77.8,
    color: 0xd8ca9d,
    yearLength: 11.86 * EARTH_YEAR,
    rotationSpeed: 0.02
  },
  {
    name: 'Saturn',
    radius: 9.45,
    distance: 143,
    color: 0xead6b8,
    yearLength: 29.46 * EARTH_YEAR,
    rotationSpeed: 0.022,
    hasRings: true
  },
  {
    name: 'Uranus',
    radius: 4.0,
    distance: 287,
    color: 0xc5e5ea,
    yearLength: 84.01 * EARTH_YEAR,
    rotationSpeed: 0.014
  },
  {
    name: 'Neptune',
    radius: 3.88,
    distance: 450,
    color: 0x3d5ef5,
    yearLength: 164.79 * EARTH_YEAR,
    rotationSpeed: 0.015
  }
];

// Simulation state
let timeSpeed = TIME_SCALE.DEFAULT;
let isPaused = false;
let dayCount = 0;

// DOM elements
const dayCountElement = document.getElementById('day-count');
const slowerButton = document.getElementById('slower');
const pauseButton = document.getElementById('pause');
const fasterButton = document.getElementById('faster');

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('solar-system').appendChild(renderer.domElement);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// Add point light at the sun's position
const sunLight = new THREE.PointLight(0xffffff, 1.5);
scene.add(sunLight);

// Add stars background
createStars();

// Create the sun
const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  emissive: 0xffff00,
  emissiveIntensity: 1
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Create planets
const planetObjects = PLANETS.map(createPlanet);

// Set up camera and controls
camera.position.set(0, 50, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Event listeners for controls
slowerButton.addEventListener('click', () => {
  timeSpeed = Math.max(timeSpeed / 2, TIME_SCALE.MIN);
});

pauseButton.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
});

fasterButton.addEventListener('click', () => {
  timeSpeed = Math.min(timeSpeed * 2, TIME_SCALE.MAX);
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  if (!isPaused) {
    // Update day count
    dayCount += timeSpeed;
    dayCountElement.textContent = Math.floor(dayCount);
    
    // Update planet positions
    planetObjects.forEach((planet, index) => {
      const planetData = PLANETS[index];
      
      // Calculate orbital position
      const orbitalProgress = (dayCount / planetData.yearLength) * Math.PI * 2;
      planet.position.x = Math.cos(orbitalProgress) * planetData.distance;
      planet.position.z = Math.sin(orbitalProgress) * planetData.distance;
      
      // Rotate the planet
      planet.rotation.y += planetData.rotationSpeed * timeSpeed * 0.01;
      
      // Update rings if planet has them
      if (planetData.hasRings && planet.rings) {
        planet.rings.rotation.z = 0.01;
      }
    });
    
    // Rotate the sun
    sun.rotation.y += 0.001 * timeSpeed;
  }
  
  controls.update();
  renderer.render(scene, camera);
}

// Helper function to create a planet
function createPlanet(planetData) {
  // Create planet geometry and material
  const planetGeometry = new THREE.SphereGeometry(planetData.radius, 32, 32);
  const planetMaterial = new THREE.MeshStandardMaterial({
    color: planetData.color,
    roughness: 0.7,
    metalness: 0.1
  });
  
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  
  // Position the planet
  planet.position.x = planetData.distance;
  
  // Add rings for Saturn
  if (planetData.hasRings) {
    const ringGeometry = new THREE.RingGeometry(
      planetData.radius * 1.4,
      planetData.radius * 2.2,
      64
    );
    
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xf8e8c0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    planet.add(rings);
    planet.rings = rings;
  }
  
  // Add orbit path visualization
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitPoints = [];
  
  for (let i = 0; i <= 360; i++) {
    const angle = (i * Math.PI) / 180;
    orbitPoints.push(
      Math.cos(angle) * planetData.distance,
      0,
      Math.sin(angle) * planetData.distance
    );
  }
  
  orbitGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(orbitPoints, 3)
  );
  
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x444444,
    transparent: true,
    opacity: 0.3
  });
  
  const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
  scene.add(orbit);
  
  // Add planet to scene
  scene.add(planet);
  
  return planet;
}

// Create stars background
function createStars() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    sizeAttenuation: false
  });
  
  const starsVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starsVertices, 3)
  );
  
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}

// Start the animation
animate(); 