const fragmentShader = `
uniform float u_intensity;
uniform float u_time;
uniform vec3 u_color;

varying vec2 vUv;
varying float vDisplacement;

void main() {
    float distort = 2.0 * vDisplacement * u_intensity * sin(vUv.y * 10.0 + u_time);
    vec3 baseColor = vec3(abs(vUv - 0.5) * 2.0  * (1.0 - distort), 1.0);
    
    // Combine base grayscale perlin color with the dynamic u_color tint
    vec3 finalColor = mix(baseColor * u_color, u_color, 0.4);

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default fragmentShader;

