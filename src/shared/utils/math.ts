import type { Vector3, Quaternion, EulerAngles, Pose } from "@/shared/types";

export function quaternionToEuler(q: Quaternion): EulerAngles {
  const sinrCosp = 2 * (q.w * q.x + q.y * q.z);
  const cosrCosp = 1 - 2 * (q.x * q.x + q.y * q.y);
  const roll = Math.atan2(sinrCosp, cosrCosp);

  const sinp = 2 * (q.w * q.y - q.z * q.x);
  const pitch = Math.abs(sinp) >= 1
    ? (sinp > 0 ? Math.PI / 2 : -Math.PI / 2)
    : Math.asin(sinp);

  const sinyCosp = 2 * (q.w * q.z + q.x * q.y);
  const cosyCosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  const yaw = Math.atan2(sinyCosp, cosyCosp);

  return { roll, pitch, yaw };
}

export function eulerToQuaternion(e: EulerAngles): Quaternion {
  const cr = Math.cos(e.roll / 2);
  const sr = Math.sin(e.roll / 2);
  const cp = Math.cos(e.pitch / 2);
  const sp = Math.sin(e.pitch / 2);
  const cy = Math.cos(e.yaw / 2);
  const sy = Math.sin(e.yaw / 2);

  return {
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy,
    w: cr * cp * cy + sr * sp * sy,
  };
}

export function multiplyQuaternion(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

export function rotateVectorByQuaternion(v: Vector3, q: Quaternion): Vector3 {
  const qv: Quaternion = { x: v.x, y: v.y, z: v.z, w: 0 };
  const qConj: Quaternion = { x: -q.x, y: -q.y, z: -q.z, w: q.w };
  const rotated = multiplyQuaternion(multiplyQuaternion(q, qv), qConj);
  return { x: rotated.x, y: rotated.y, z: rotated.z };
}

export function addVectors(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtractVectors(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vectorMagnitude(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function normalizeVector(v: Vector3): Vector3 {
  const mag = vectorMagnitude(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

export function vectorDistance(a: Vector3, b: Vector3): number {
  return vectorMagnitude(subtractVectors(a, b));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPose(from: Pose, to: Pose, t: number): Pose {
  return {
    position: {
      x: lerp(from.position.x, to.position.x, t),
      y: lerp(from.position.y, to.position.y, t),
      z: lerp(from.position.z, to.position.z, t),
    },
    orientation: {
      x: lerp(from.orientation.x, to.orientation.x, t),
      y: lerp(from.orientation.y, to.orientation.y, t),
      z: lerp(from.orientation.z, to.orientation.z, t),
      w: lerp(from.orientation.w, to.orientation.w, t),
    },
  };
}
