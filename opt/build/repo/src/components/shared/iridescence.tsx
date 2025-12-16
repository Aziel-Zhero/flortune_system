
"use client";

import { Renderer, Program, Mesh, Color, Triangle, Vec2, Vec3 } from "ogl";
import type { Texture } from "ogl";
import { useEffect, useRef } from "react";

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution; // vec3(width, height, aspect_ratio)
uniform vec2 uMouse; // vec2(mouseX, mouseY) normalized 0-1
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  // Apply mouse interaction if amplitude is greater than zero
  // The original formula assumes uMouse is 0-1 and wants to center it.
  // If uAmplitude is 0, this effectively does nothing.
  uv += (uMouse - vec2(0.5)) * uAmplitude;


  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

interface IridescenceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  fluidColor?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
}

export default function Iridescence({
  fluidColor = [1, 1, 1], // Default white
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  ...rest
}: IridescenceProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 }); // Initial mouse position (center)

  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;
    
    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), antialias: true });
    const gl = renderer.gl;
    gl.clearColor(0,0,0,1); // Black, fully opaque

    let program: Program;
    let mesh: Mesh;

    function resize() {
      const ctnWidth = ctn.offsetWidth;
      const ctnHeight = ctn.offsetHeight;
      renderer.setSize(ctnWidth, ctnHeight);
      if (program) {
        program.uniforms.uResolution.value = new Vec3(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      }
    }
    window.addEventListener("resize", resize, false);
    

    const geometry = new Triangle(gl);
    
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...fluidColor) },
        uResolution: {
          value: new Vec3(1, 1, 1),
        },
        uMouse: { value: new Vec2(mousePos.current.x, mousePos.current.y) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
      },
    });

    mesh = new Mesh(gl, { geometry, program });
    
    resize();

    let animateId: number;

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    
    if (ctn.firstChild) {
        ctn.insertBefore(gl.canvas, ctn.firstChild);
    } else {
        ctn.appendChild(gl.canvas);
    }
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.zIndex = '-1';

    function handleMouseMove(e: MouseEvent) {
      if (!ctn) return;
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height; 
      mousePos.current = { x, y };
      if(program) {
        program.uniforms.uMouse.value.set(x, y);
      }
    }

    if (mouseReact) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      if (mouseReact) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      if (ctn && gl.canvas.parentNode === ctn) {
         ctn.removeChild(gl.canvas);
      }
      const loseContextExt = gl.getExtension("WEBGL_lose_context");
      if (loseContextExt) {
        loseContextExt.loseContext();
      }
    };
  }, [fluidColor, speed, amplitude, mouseReact]);

  return (
    <div
      ref={ctnDom}
      className="w-full h-full fixed inset-0 overflow-hidden -z-10"
      {...rest}
    />
  );
}
