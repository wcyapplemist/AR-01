import type { Vector3 } from "@/shared/types";
import type { QRContent } from "../types";

export class QRContentValidator {
  validate(raw: string): QRContent {
    const now = Date.now();

    if (!raw || raw.trim().length === 0) {
      return this.buildInvalid(raw, now);
    }

    if (!this.isRecognizedFormat(raw)) {
      return this.buildInvalid(raw, now);
    }

    const parts = raw.split("|");
    if (parts.length < 4) {
      return this.buildInvalid(raw, now);
    }

    const [, id, posStr, checksum] = parts;

    if (!id || id.length === 0 || id.length > 32) {
      return this.buildInvalid(raw, now);
    }

    const pos = this.parsePosition(posStr);
    if (!pos) {
      return this.buildInvalid(raw, now);
    }

    const checksumPayload = `${id}|${posStr}`;
    const isValid = this.computeChecksum(checksumPayload) === checksum;

    const content: QRContent = {
      id,
      pos,
      raw,
      format: "standard",
      checksum,
      isValid,
      decodedAt: now,
    };

    return content;
  }

  isRecognizedFormat(raw: string): boolean {
    return /^ARPOS\|/.test(raw);
  }

  verifyChecksum(content: {
    id: string;
    pos: Vector3;
    checksum: string;
  }): boolean {
    const payload = `${content.id}|${content.pos.x},${content.pos.y},${content.pos.z}`;
    const computed = this.computeChecksum(payload);
    return computed === content.checksum;
  }

  static getSupportedFormats(): readonly ("standard" | "extended")[] {
    return ["standard"] as const;
  }

  private parsePosition(str: string): Vector3 | null {
    const parts = str.split(",");
    if (parts.length !== 3) return null;
    const [xs, ys, zs] = parts;
    const x = parseFloat(xs);
    const y = parseFloat(ys);
    const z = parseFloat(zs);
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) return null;
    return { x, y, z };
  }

  private computeChecksum(payload: string): string {
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const ch = payload.charCodeAt(i);
      hash = ((hash << 5) - hash + ch) | 0;
    }
    return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 6);
  }

  private buildInvalid(
    raw: string,
    decodedAt: number,
  ): QRContent {
    return {
      id: "",
      pos: { x: 0, y: 0, z: 0 },
      raw,
      format: "standard",
      checksum: "",
      isValid: false,
      decodedAt,
    };
  }
}
