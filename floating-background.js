/**
 * Interactive 3D Floating Acrylic Objects Canvas Engine
 * Simulates floating geometric glass polyhedra, translucent acrylic orbs, 
 * ambient luminous dust motes, and gentle mouse parallax physics.
 */

class FloatingBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.mouse = {
      x: this.width / 2,
      y: this.height / 2,
      targetX: this.width / 2,
      targetY: this.height / 2,
      vx: 0,
      vy: 0,
      radius: 180,
      active: false
    };

    this.objects = [];
    this.dustParticles = [];
    this.ambientOrbs = [];
    this.animationFrameId = null;
    this.lastTime = performance.now();
    this.isPaused = false;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    document.addEventListener('visibilitychange', () => {
      this.isPaused = document.hidden;
      if (!this.isPaused) {
        this.lastTime = performance.now();
        this.animate();
      }
    });

    this.createScene();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);

    if (this.objects.length > 0) {
      // Rebalance positions if needed
      this.objects.forEach(obj => {
        obj.x = Math.min(obj.x, this.width - 50);
        obj.y = Math.min(obj.y, this.height - 50);
      });
    }
  }

  createScene() {
    this.objects = [];
    this.dustParticles = [];
    this.ambientOrbs = [];

    // 1. Ambient deep glowing blurred orbs in the background
    const ambientColors = [
      'rgba(229, 184, 105, 0.07)',  // Champagne gold glow
      'rgba(99, 102, 241, 0.06)',   // Soft indigo glow
      'rgba(16, 185, 129, 0.05)',   // Emerald accent glow
      'rgba(255, 255, 255, 0.04)'   // Pearl highlight
    ];

    for (let i = 0; i < 5; i++) {
      this.ambientOrbs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        baseX: Math.random() * this.width,
        baseY: Math.random() * this.height,
        radius: 200 + Math.random() * 260,
        color: ambientColors[i % ambientColors.length],
        driftSpeedX: (Math.random() - 0.5) * 0.15,
        driftSpeedY: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2
      });
    }

    // 2. Interactive 3D Geometric Floating Objects (Polyhedra & Acrylic Gems)
    const shapes = ['octahedron', 'icosahedron', 'cube', 'prism', 'sphere', 'torusRing'];
    const count = this.width < 768 ? 7 : 14;

    for (let i = 0; i < count; i++) {
      const type = shapes[i % shapes.length];
      const size = 30 + Math.random() * 45;
      
      this.objects.push({
        type: type,
        x: Math.random() * (this.width - 100) + 50,
        y: Math.random() * (this.height - 100) + 50,
        baseX: 0,
        baseY: 0,
        vx: 0,
        vy: 0,
        size: size,
        rotationX: Math.random() * Math.PI * 2,
        rotationY: Math.random() * Math.PI * 2,
        rotationZ: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 0.008,
        rotSpeedY: (Math.random() - 0.5) * 0.01,
        rotSpeedZ: (Math.random() - 0.5) * 0.006,
        floatFreq: 0.001 + Math.random() * 0.0015,
        floatAmp: 25 + Math.random() * 35,
        floatPhase: Math.random() * Math.PI * 2,
        glassTint: i % 3 === 0 ? 'rgba(229, 184, 105, 0.16)' : (i % 3 === 1 ? 'rgba(160, 190, 255, 0.14)' : 'rgba(255, 255, 255, 0.12)'),
        rimGlow: i % 2 === 0 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(229, 184, 105, 0.35)',
        layer: Math.random() > 0.5 ? 'front' : 'back',
        depth: 0.6 + Math.random() * 0.7
      });
    }

    // Initial base reference
    this.objects.forEach(obj => {
      obj.baseX = obj.x;
      obj.baseY = obj.y;
    });

    // 3. Floating luminous dust motes
    const dustCount = this.width < 768 ? 30 : 65;
    for (let i = 0; i < dustCount; i++) {
      this.dustParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 0.8 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.6,
        speedY: -0.2 - Math.random() * 0.4,
        speedX: (Math.random() - 0.5) * 0.2,
        flickerSpeed: 0.01 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // 3D Polyhedron geometry generators
  getVertices(type, size) {
    const s = size;
    if (type === 'cube') {
      return [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s]
      ];
    } else if (type === 'octahedron') {
      return [
        [0, -s * 1.3, 0], [0, s * 1.3, 0],
        [-s, 0, 0], [s, 0, 0],
        [0, 0, -s], [0, 0, s]
      ];
    } else if (type === 'prism') {
      const h = s * 1.2;
      const r = s * 0.9;
      return [
        // Top triangle
        [0, -h, r], [r * 0.866, -h, -r * 0.5], [-r * 0.866, -h, -r * 0.5],
        // Bottom triangle
        [0, h, r], [r * 0.866, h, -r * 0.5], [-r * 0.866, h, -r * 0.5]
      ];
    } else if (type === 'icosahedron') {
      const phi = (1 + Math.sqrt(5)) / 2;
      const a = s * 0.7;
      const b = a * phi;
      return [
        [-a, b, 0], [a, b, 0], [-a, -b, 0], [a, -b, 0],
        [0, -a, b], [0, a, b], [0, -a, -b], [0, a, -b],
        [b, 0, -a], [b, 0, a], [-b, 0, -a], [-b, 0, a]
      ];
    }
    return [];
  }

  getEdges(type) {
    if (type === 'cube') {
      return [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];
    } else if (type === 'octahedron') {
      return [
        [0, 2], [0, 3], [0, 4], [0, 5],
        [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 4], [4, 3], [3, 5], [5, 2]
      ];
    } else if (type === 'prism') {
      return [
        [0, 1], [1, 2], [2, 0],
        [3, 4], [4, 5], [5, 3],
        [0, 3], [1, 4], [2, 5]
      ];
    } else if (type === 'icosahedron') {
      return [
        [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
        [1, 5], [1, 7], [1, 8], [1, 9],
        [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
        [3, 4], [3, 6], [3, 8], [3, 9],
        [4, 5], [4, 9], [4, 11],
        [5, 9], [5, 11],
        [6, 7], [6, 8], [6, 10],
        [7, 8], [7, 10],
        [8, 9], [10, 11]
      ];
    }
    return [];
  }

  // 3D vector rotation
  rotate3D(point, rx, ry, rz) {
    let [x, y, z] = point;

    // Rotate X
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;

    // Rotate Y
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    let x2 = x * cosY + z1 * sinY;
    let z2 = -x * sinY + z1 * cosY;

    // Rotate Z
    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);
    let x3 = x2 * cosZ - y1 * sinZ;
    let y3 = x2 * sinZ + y1 * cosZ;

    return [x3, y3, z2];
  }

  update(delta, time) {
    // Mouse smooth interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    // Update ambient background orbs
    this.ambientOrbs.forEach(orb => {
      orb.x = orb.baseX + Math.sin(time * 0.0003 + orb.phase) * 60;
      orb.y = orb.baseY + Math.cos(time * 0.0002 + orb.phase) * 60;
    });

    // Update floating 3D objects
    this.objects.forEach(obj => {
      // Rotation
      obj.rotationX += obj.rotSpeedX;
      obj.rotationY += obj.rotSpeedY;
      obj.rotationZ += obj.rotSpeedZ;

      // Natural bobbing wave motion
      const floatY = Math.sin(time * obj.floatFreq + obj.floatPhase) * obj.floatAmp;
      const floatX = Math.cos(time * (obj.floatFreq * 0.7) + obj.floatPhase) * (obj.floatAmp * 0.5);

      // Mouse proximity repulsion and subtle attraction
      const dx = obj.x - this.mouse.x;
      const dy = obj.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouse.radius && this.mouse.active) {
        const force = (1 - dist / this.mouse.radius) * 1.5;
        obj.vx += (dx / dist) * force;
        obj.vy += (dy / dist) * force;
        // Subtle tilt on mouse interaction
        obj.rotationX += 0.015 * force;
        obj.rotationY += 0.015 * force;
      }

      // Dampen velocity back to natural equilibrium
      obj.vx *= 0.92;
      obj.vy *= 0.92;

      obj.x = obj.baseX + floatX + obj.vx;
      obj.y = obj.baseY + floatY + obj.vy;
    });

    // Update dust particles
    this.dustParticles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.alpha = 0.2 + (Math.sin(time * p.flickerSpeed + p.phase) + 1) * 0.25;

      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw ambient light blobs for deep frosted atmospheric glow
    this.ambientOrbs.forEach(orb => {
      const grad = this.ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
      grad.addColorStop(0, orb.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 2. Draw luminous dust motes
    this.dustParticles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(229, 184, 105, ${p.alpha})`;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = 'rgba(229, 184, 105, 0.4)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // reset
    });

    // 3. Draw 3D Floating Objects
    this.objects.forEach(obj => {
      this.ctx.save();
      this.ctx.translate(obj.x, obj.y);

      if (obj.type === 'sphere') {
        // Acrylic Frosted Glass Sphere with Specular Refraction
        const r = obj.size * 0.85;

        // Base glass body with radial refraction
        const sphereGrad = this.ctx.createRadialGradient(
          -r * 0.35, -r * 0.4, r * 0.1,
          0, 0, r
        );
        sphereGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        sphereGrad.addColorStop(0.3, obj.glassTint);
        sphereGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0.06)');
        sphereGrad.addColorStop(1, 'rgba(255, 255, 255, 0.28)');

        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fillStyle = sphereGrad;
        this.ctx.fill();

        // Rim acrylic outline
        this.ctx.lineWidth = 1.2;
        this.ctx.strokeStyle = obj.rimGlow;
        this.ctx.stroke();

        // Specular highlight spot (acrylic lens reflection)
        this.ctx.beginPath();
        this.ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.28, r * 0.16, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        this.ctx.fill();

      } else if (obj.type === 'torusRing') {
        // Acrylic Torus / Floating Halo
        const outerR = obj.size;
        const innerR = obj.size * 0.65;
        this.ctx.rotate(obj.rotationX);

        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, outerR, outerR * 0.45, obj.rotationZ, 0, Math.PI * 2);
        this.ctx.lineWidth = outerR - innerR;
        this.ctx.strokeStyle = obj.glassTint;
        this.ctx.stroke();

        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = obj.rimGlow;
        this.ctx.stroke();

      } else {
        // 3D Polyhedra: Cube, Octahedron, Prism, Icosahedron
        const vertices = this.getVertices(obj.type, obj.size);
        const edges = this.getEdges(obj.type);

        // Project 3D to 2D
        const projected = vertices.map(v => {
          const [rx, ry, rz] = this.rotate3D(v, obj.rotationX, obj.rotationY, obj.rotationZ);
          // Perspective projection factor
          const fov = 400;
          const scale = fov / (fov + rz);
          return [rx * scale, ry * scale, rz];
        });

        // Translucent facet fill for acrylic body
        if (projected.length >= 3) {
          this.ctx.beginPath();
          this.ctx.moveTo(projected[0][0], projected[0][1]);
          for (let i = 1; i < Math.min(projected.length, 6); i++) {
            this.ctx.lineTo(projected[i][0], projected[i][1]);
          }
          this.ctx.closePath();
          this.ctx.fillStyle = obj.glassTint;
          this.ctx.fill();
        }

        // Draw crisp acrylic glass edges
        this.ctx.beginPath();
        edges.forEach(([i, j]) => {
          if (projected[i] && projected[j]) {
            this.ctx.moveTo(projected[i][0], projected[i][1]);
            this.ctx.lineTo(projected[j][0], projected[j][1]);
          }
        });
        this.ctx.lineWidth = 1.1;
        this.ctx.strokeStyle = obj.rimGlow;
        this.ctx.stroke();

        // Luminous vertices (specular highlights at joints)
        projected.forEach(([px, py, pz]) => {
          if (pz > -obj.size * 0.3) { // only front vertices
            this.ctx.beginPath();
            this.ctx.arc(px, py, 1.8, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          }
        });
      }

      this.ctx.restore();
    });
  }

  animate(currentTime = performance.now()) {
    if (this.isPaused) return;

    const delta = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(delta, currentTime);
    this.draw();

    this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
  }

  setIntensity(level) {
    // level: 'subtle', 'balanced', 'vibrant'
    if (level === 'subtle') {
      this.objects.forEach(o => o.size *= 0.8);
    } else if (level === 'vibrant') {
      this.objects.forEach(o => o.size *= 1.25);
    }
  }
}

// Global initialization helper
document.addEventListener('DOMContentLoaded', () => {
  window.AuraFloatingBackground = new FloatingBackground('floating-canvas');
});
