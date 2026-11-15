#!/usr/bin/env python3
"""Демо-модель для 3D-вьюера (T-43 + T-C07).

Настоящие `.glb` — контентный поток E-11 (1–2 модели CC0). Пока их нет, вьюер
нечем проверить, поэтому скрипт собирает простую поверхность вращения —
силуэт платья-манекена — и пишет валидный GLB 2.0 без внешних библиотек.

Запуск: python scripts/generate-demo-glb.py
Результат: public/models/demo-dress-form.glb (~1,2 м в высоту, ≤ 100 КБ).
"""

from __future__ import annotations

import json
import math
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "models" / "demo-dress-form.glb"

# Профиль изделия: (высота, радиус) от низа к горловине. Метры, Y вверх.
PROFILE = [
    (0.00, 0.46),
    (0.08, 0.45),
    (0.20, 0.42),
    (0.34, 0.37),
    (0.46, 0.32),
    (0.54, 0.29),
    (0.62, 0.29),
    (0.70, 0.32),
    (0.78, 0.35),
    (0.86, 0.36),
    (0.94, 0.34),
    (1.00, 0.30),
    (1.05, 0.24),
    (1.09, 0.15),
    (1.12, 0.09),
]

SEGMENTS = 64
BASE_COLOR = [0.71, 0.51, 0.47, 1.0]


def profile_normals(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Нормаль в плоскости (радиус, высота) для каждой точки профиля."""
    normals: list[tuple[float, float]] = []

    for index, (y, r) in enumerate(points):
        prev_y, prev_r = points[max(0, index - 1)]
        next_y, next_r = points[min(len(points) - 1, index + 1)]
        dy = next_y - prev_y
        dr = next_r - prev_r
        length = math.hypot(dy, dr) or 1.0
        # Нормаль к касательной (dr, dy), направленная наружу от оси.
        normals.append((dy / length, -dr / length))

    return normals


def build_geometry() -> tuple[list[float], list[float], list[int]]:
    points = PROFILE
    face_normals = profile_normals(points)

    positions: list[float] = []
    normals: list[float] = []

    for (y, r), (nr, ny) in zip(points, face_normals):
        for segment in range(SEGMENTS):
            theta = 2.0 * math.pi * segment / SEGMENTS
            cos_t, sin_t = math.cos(theta), math.sin(theta)
            positions.extend([r * cos_t, y, r * sin_t])
            nx, ny_n, nz = nr * cos_t, ny, nr * sin_t
            length = math.hypot(nx, ny_n, nz) or 1.0
            normals.extend([nx / length, ny_n / length, nz / length])

    indices: list[int] = []

    def triangle(a: int, b: int, c: int, outward: tuple[float, float, float]) -> None:
        """Добавляет треугольник с обходом, при котором нормаль смотрит наружу."""
        ax, ay, az = positions[a * 3 : a * 3 + 3]
        bx, by, bz = positions[b * 3 : b * 3 + 3]
        cx, cy, cz = positions[c * 3 : c * 3 + 3]
        ux, uy, uz = bx - ax, by - ay, bz - az
        vx, vy, vz = cx - ax, cy - ay, cz - az
        nx = uy * vz - uz * vy
        ny = uz * vx - ux * vz
        nz = ux * vy - uy * vx

        if nx * outward[0] + ny * outward[1] + nz * outward[2] < 0:
            b, c = c, b

        indices.extend([a, b, c])

    for ring in range(len(points) - 1):
        lower = ring * SEGMENTS
        upper = (ring + 1) * SEGMENTS

        for segment in range(SEGMENTS):
            next_segment = (segment + 1) % SEGMENTS
            a = lower + segment
            b = lower + next_segment
            c = upper + segment
            d = upper + next_segment

            # Средняя нормаль пары вершин как «наружу» для проверки обхода.
            theta = 2.0 * math.pi * (segment + 0.5) / SEGMENTS
            outward = (math.cos(theta), 0.0, math.sin(theta))

            triangle(a, c, b, outward)
            triangle(b, c, d, outward)

    # Заглушка горловины: веер от центра верхнего кольца.
    top_y = points[-1][0]
    center = len(positions) // 3
    positions.extend([0.0, top_y, 0.0])
    normals.extend([0.0, 1.0, 0.0])

    top_ring = (len(points) - 1) * SEGMENTS
    for segment in range(SEGMENTS):
        a = top_ring + segment
        b = top_ring + (segment + 1) % SEGMENTS
        triangle(center, a, b, (0.0, 1.0, 0.0))

    return positions, normals, indices


def align4(size: int) -> int:
    return (size + 3) & ~3


def build_glb() -> bytes:
    positions, normals, indices = build_geometry()

    position_bytes = struct.pack(f"<{len(positions)}f", *positions)
    normal_bytes = struct.pack(f"<{len(normals)}f", *normals)
    index_bytes = struct.pack(f"<{len(indices)}H", *indices)

    positions_offset = 0
    normals_offset = align4(positions_offset + len(position_bytes))
    indices_offset = align4(normals_offset + len(normal_bytes))
    binary_length = align4(indices_offset + len(index_bytes))

    binary = bytearray(binary_length)
    binary[positions_offset : positions_offset + len(position_bytes)] = position_bytes
    binary[normals_offset : normals_offset + len(normal_bytes)] = normal_bytes
    binary[indices_offset : indices_offset + len(index_bytes)] = index_bytes

    xs = positions[0::3]
    ys = positions[1::3]
    zs = positions[2::3]

    gltf = {
        "asset": {"version": "2.0", "generator": "SewIt scripts/generate-demo-glb.py"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "DressForm", "rotation": [0.0, 0.0, 0.0, 1.0]}],
        "meshes": [
            {
                "name": "DressForm",
                "primitives": [
                    {
                        "attributes": {"POSITION": 0, "NORMAL": 1},
                        "indices": 2,
                        "material": 0,
                        "mode": 4,
                    }
                ],
            }
        ],
        "materials": [
            {
                "name": "Fabric",
                "doubleSided": True,
                "pbrMetallicRoughness": {
                    "baseColorFactor": BASE_COLOR,
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.85,
                },
            }
        ],
        "buffers": [{"byteLength": binary_length}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": positions_offset, "byteLength": len(position_bytes)},
            {"buffer": 0, "byteOffset": normals_offset, "byteLength": len(normal_bytes)},
            {"buffer": 0, "byteOffset": indices_offset, "byteLength": len(index_bytes)},
        ],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": len(positions) // 3,
                "type": "VEC3",
                "min": [min(xs), min(ys), min(zs)],
                "max": [max(xs), max(ys), max(zs)],
            },
            {
                "bufferView": 1,
                "componentType": 5126,
                "count": len(normals) // 3,
                "type": "VEC3",
            },
            {
                "bufferView": 2,
                "componentType": 5123,
                "count": len(indices),
                "type": "SCALAR",
            },
        ],
    }

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_bytes += b" " * (align4(len(json_bytes)) - len(json_bytes))

    total = 12 + 8 + len(json_bytes) + 8 + len(binary)
    header = struct.pack("<III", 0x46546C67, 2, total)
    json_chunk = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    binary_chunk = struct.pack("<II", len(binary), 0x004E4942) + bytes(binary)

    return header + json_chunk + binary_chunk


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = build_glb()
    OUT.write_bytes(data)
    print(f"{OUT.relative_to(OUT.parents[2])}: {len(data) / 1024:.1f} КБ")


if __name__ == "__main__":
    main()
