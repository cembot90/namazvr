// Bildqualität: Licht aus HDRI-Umgebungen (CC0, Poly Haven), Tone Mapping, weiche Schatten.
// „Hoch“: mit Schatten; „Normal“ (Standard auf der Quest): ohne Schatten, damit es flüssig bleibt.
import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BASE = new URL('../vendor/hdri/', import.meta.url).href;
// Umgebung je Ort: innen warmes Licht, draußen Himmel, nachts Nacht
const INDOOR = 'lobby';
export function envFor(scene, night) {
  if (!scene || ['miqat', 'cemevi', 'wudu'].includes(scene)) return INDOOR;
  if (['fire', 'cave', 'starsky'].includes(scene)) return 'night';
  if (scene === 'sea') return 'sunset';
  if (['ark', 'nile', 'valley'].includes(scene)) return 'sky';
  if (scene === 'muzdalifa' || night) return 'night';
  if (scene === 'arafat') return 'sunset';
  return 'sky';
}

export class Graphics {
  constructor(renderer, scene, world, high) {
    this.renderer = renderer;
    this.scene = scene;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.cache = new Map();
    this.loader = new EXRLoader();
    // Sonne für die Schatten: folgt dem Gebetsplatz, deckt etwa 16 × 16 m ab
    const sun = new THREE.DirectionalLight(0xfff1dc, 1.5);
    sun.position.set(4, 9, 3);
    sun.target.position.set(0, 0, -1);
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 25 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    world.add(sun, sun.target);
    this.sun = sun;
    this.setQuality(high);
  }

  // Nachbearbeitung bei „Hoch“ (nicht in der Brille – dort zählt jede Millisekunde):
  // sanftes Leuchten der Lampen (Bloom), am Computer zusätzlich Kontaktschatten in Ecken und Fugen (GTAO).
  // ao = Kontaktschatten erlaubt (aus am Handy, weil zu teuer)
  usePost(camera, { ao = true } = {}) { this.camera = camera; this.ao = ao; }

  buildPost() {
    const r = this.renderer, size = r.getSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x * r.getPixelRatio(), size.y * r.getPixelRatio(), { type: THREE.HalfFloatType, samples: 4 });
    const c = new EffectComposer(r, target);
    c.addPass(new RenderPass(this.scene, this.camera));
    if (this.ao) {
      const ao = new GTAOPass(this.scene, this.camera, size.x, size.y);
      ao.output = GTAOPass.OUTPUT.Default;
      ao.blendIntensity = 0.85;
      ao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.5, thickness: 1.2, scale: 1, samples: 12 });
      c.addPass(ao);
    }
    // Nur wirklich helle Stellen (Lampen, Sonnenflecken) leuchten; weiße Schrift auf den Tafeln bleibt scharf
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.38, 0.55, 1.0);
    c.addPass(this.bloom);
    c.addPass(new OutputPass());
    this.composer = c;
  }

  resize() {
    if (!this.composer) return;
    const size = this.renderer.getSize(new THREE.Vector2());
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(size.x, size.y);
  }

  render(camera) {
    const r = this.renderer;
    this.camera ||= camera;
    if (!this.high || r.xr.isPresenting) { r.render(this.scene, camera); return; }
    if (!this.composer && !this.postFailed) {
      try { this.buildPost(); } catch { this.postFailed = true; }
    }
    if (this.postFailed || !this.composer) { r.render(this.scene, camera); return; }
    this.composer.render();
  }

  setQuality(high) {
    this.high = high;
    this.renderer.shadowMap.enabled = high;
    this.sun.castShadow = high;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, high ? 2 : 1.5));
    this.resize();
    // Materialien neu übersetzen lassen (Schatten an/aus)
    this.scene.traverse((o) => { for (const m of [].concat(o.material || [])) m.needsUpdate = true; });
  }

  async setEnv(name) {
    if (this.name === name) return;
    this.name = name;
    let tex = this.cache.get(name);
    if (!tex) {
      try {
        const hdr = await this.loader.loadAsync(`${BASE}${name}.exr`);
        tex = this.pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();
        this.cache.set(name, tex);
      } catch { return; }
    }
    if (this.name === name) this.scene.environment = tex;
  }

  // Nach dem Bau eines Ortes: Lampen etwas zurücknehmen (die Umgebung leuchtet mit), Böden empfangen Schatten
  afterBuild(group) {
    group.traverse((o) => {
      if (o.isHemisphereLight) o.intensity *= 0.42;
      else if (o.isDirectionalLight) o.intensity *= 0.6;
      if (o.isMesh) o.receiveShadow = true;
    });
  }

  // Figuren werfen Schatten 
  casters(root) {
    root.traverse((o) => {
      if (o.isMesh && o.userData.figure && !o.material.transparent) o.castShadow = true;
    });
  }
}
