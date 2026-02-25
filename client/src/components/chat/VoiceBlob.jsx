import React from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import Blob from "../Blob";

export default function VoiceBlob({ state }) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <Canvas camera={{ position: [0.0, 0.0, 8.0] }}>
        <Blob state={state} />
        <EffectComposer disableNormalPass>
          <Bloom
            luminanceThreshold={0.1}
            mipmapBlur
            intensity={1.2}
            radius={0.6}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
