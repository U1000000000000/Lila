import React, { useMemo, useRef } from "react";
import vertexShader from "./vertexShader";
import fragmentShader from "./fragmentShader";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Color } from "three";

const Blob = ({ state = "idle" }) => {
  const mesh = useRef();
  const uniforms = useMemo(() => {
    return {
      u_time: { value: 0 },
      u_intensity: { value: 0.1 },
      // default idle color: Darker Lavender #8B5CF6
      u_color: { value: new Color(139 / 255, 92 / 255, 246 / 255) },
    };
  }, []);

  useFrame((_, delta) => {
    if (mesh.current) {
      // Determine target values based on state
      let targetIntensity = 0.1;
      let targetSpeed = 0.3;
      // Darker Lavender #8B5CF6
      let targetColor = new Color(139 / 255, 92 / 255, 246 / 255);

      if (state === "listening") {
        targetIntensity = 0.3;
        targetSpeed = 0.6;
        // Core Lavender #A78BFA
        targetColor = new Color(167 / 255, 139 / 255, 250 / 255);
      } else if (state === "computing") {
        targetIntensity = 0.6;
        targetSpeed = 1.8;
        // Lighter Lavender #C4B5FD
        targetColor = new Color(196 / 255, 181 / 255, 253 / 255);
      } else if (state === "speaking") {
        targetIntensity = 0.9;
        targetSpeed = 1.2;
        // Bright White Lavender #F5F3FF
        targetColor = new Color(245 / 255, 243 / 255, 255 / 255);
      }

      // Accumulate time based on dynamic speed
      mesh.current.material.uniforms.u_time.value += delta * targetSpeed;

      // Smoothly interpolate intensity
      mesh.current.material.uniforms.u_intensity.value = MathUtils.lerp(
        mesh.current.material.uniforms.u_intensity.value,
        targetIntensity,
        0.05,
      );

      // Smoothly interpolate color
      mesh.current.material.uniforms.u_color.value.lerp(targetColor, 0.05);
    }
  });

  return (
    <mesh ref={mesh} scale={1.2} position={[0, 0, 0]}>
      <icosahedronGeometry args={[2, 20]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={false}
      />
    </mesh>
  );
};

export default Blob;
