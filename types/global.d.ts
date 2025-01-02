
import { ReactThreeFiber } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Merges the JSX namespace so we can write
 *   <mesh> <sphereGeometry> <ambientLight> ...
 * in TypeScript.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Basic mesh + geometry + material
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
      sphereGeometry: ReactThreeFiber.Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
      meshStandardMaterial: ReactThreeFiber.Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
      boxGeometry: ReactThreeFiber.Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>;

      // Lines & geometry
      line: ReactThreeFiber.Object3DNode<THREE.Line, typeof THREE.Line>;
      bufferGeometry: ReactThreeFiber.Object3DNode<THREE.BufferGeometry, typeof THREE.BufferGeometry>;
      bufferAttribute: ReactThreeFiber.Object3DNode<THREE.BufferAttribute, typeof THREE.BufferAttribute>;
      lineBasicMaterial: ReactThreeFiber.Object3DNode<THREE.LineBasicMaterial, typeof THREE.LineBasicMaterial>;

      // Lights
      ambientLight: ReactThreeFiber.Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      directionalLight: ReactThreeFiber.Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
      // etc. (Add more if needed)
    }
  }
}