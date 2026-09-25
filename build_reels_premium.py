from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path

import build_reels as base


WORK = base.ROOT / "_reels_build_premium"
SEGMENTS = WORK / "segments"
MASTER = base.OUTPUT / "TABELADO_DE_3_REELS_PREMIUM_9x16_MASTER.mp4"
INSTAGRAM = base.OUTPUT / "TABELADO_DE_3_REELS_PREMIUM_9x16_INSTAGRAM.mp4"


PHOTO_POOL = [
    "1.jpg", "3.jpg", "4.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg",
    "11.jpg", "12.jpg", "14.jpg", "15.jpg", "18.jpg", "19.jpg", "20.jpg",
    "23.jpg", "24.jpg", base.PNG_1, base.PNG_2, base.PNG_3, base.PNG_4, base.PNG_5,
    "Gemini_Generated_Image_um7cuaum7cuaum7c.jpg", "TABELADO.jpg", "TABELADO2.jpg",
]


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def companions(item: dict, index: int) -> list[Path]:
    name = item["path"].name
    if name == "TABELADO.jpg":
        names = ["TABELADO2.jpg", "Gemini_Generated_Image_um7cuaum7cuaum7c.jpg", base.PNG_3]
    elif name == "TABELADO2.jpg":
        names = ["TABELADO.jpg", "19.jpg", base.PNG_1]
    else:
        names = []
        cursor = index * 5 + 3
        while len(names) < 3:
            candidate = PHOTO_POOL[cursor % len(PHOTO_POOL)]
            cursor += 7
            if candidate != name and candidate not in names:
                names.append(candidate)
    return [base.ASSETS / name for name in names]


def photo_filter(index: int, final: bool) -> str:
    pattern = index % 3
    positions = [
        ((60, 170), (345, 825), (85, 1215)),
        ((185, 105), (55, 850), (120, 1235)),
        ((30, 335), (360, 125), (95, 1225)),
    ][pattern]
    (x1, y1), (x2, y2), (x3, y3) = positions

    parts = [
        "[0:v]fps=24,scale=1188:2112:force_original_aspect_ratio=increase,"
        "crop=1080:1920,hue=s=0,eq=contrast=1.17:brightness=-0.045:gamma=0.95[base]",
        "[1:v]fps=24,scale=820:1080:force_original_aspect_ratio=increase,"
        "crop=820:1080,hue=s=0,eq=contrast=1.20:brightness=-0.02:gamma=0.96,"
        "pad=834:1094:7:7:color=white[card1]",
        "[2:v]fps=24,scale=680:900:force_original_aspect_ratio=increase,"
        "crop=680:900,hue=s=0,eq=contrast=1.20:brightness=-0.02:gamma=0.96,"
        "pad=694:914:7:7:color=white[card2]",
        "[3:v]fps=24,scale=900:620:force_original_aspect_ratio=increase,"
        "crop=900:620,hue=s=0,eq=contrast=1.20:brightness=-0.02:gamma=0.96,"
        "pad=914:634:7:7:color=white[card3]",
        f"[base][card1]overlay=x={x1}:y={y1}:enable='gte(t,0.801)'[s1]",
        f"[s1][card2]overlay=x={x2}:y={y2}:enable='gte(t,1.602)'[s2]",
        f"[s2][card3]overlay=x={x3}:y={y3}:enable='gte(t,2.403)'[s3]",
        "[s3]drawbox=x=0:y=0:w=iw:h=ih:color=white@0.16:t=fill:enable='between(t,0.78,0.86)',"
        "drawbox=x=0:y=0:w=iw:h=ih:color=white@0.16:t=fill:enable='between(t,1.58,1.66)',"
        "drawbox=x=0:y=0:w=iw:h=ih:color=white@0.16:t=fill:enable='between(t,2.38,2.46)',"
        "noise=alls=9:allf=t+u,vignette=angle=PI/5,setsar=1,format=yuv420p"
        + (",fade=t=out:st=2.55:d=0.65:color=black" if final else "")
        + "[outv]",
    ]
    return ";".join(parts)


def video_filter(index: int) -> str:
    filters = [
        "fps=24",
        "scale=1080:1920:force_original_aspect_ratio=increase",
        "crop=1080:1920",
        "tmix=frames=3:weights='1 2 1'",
        "hue=s=0",
        "eq=contrast=1.18:brightness=-0.025:gamma=0.96",
        "unsharp=5:5:0.55:3:3:0.25",
        "noise=alls=9:allf=t+u",
        "vignette=angle=PI/5",
    ]
    if index in {5, 15, 29}:
        filters.append("fade=t=in:st=0:d=0.08:color=white")
    filters.extend(["setsar=1", "format=yuv420p"])
    return ",".join(filters)


def render_segment(item: dict, index: int, duration: float, force: bool) -> Path:
    target = SEGMENTS / f"segment_{index:02d}.mp4"
    if target.exists() and not force:
        return target

    command = [str(base.FFMPEG), "-hide_banner", "-loglevel", "warning", "-y"]
    if item["kind"] == "photo":
        sources = [item["path"], *companions(item, index)]
        for source in sources:
            command += ["-loop", "1", "-framerate", str(base.FPS), "-t", f"{duration:.6f}", "-i", str(source)]
        command += ["-filter_complex", photo_filter(index, index == 35), "-map", "[outv]"]
        detail = " + ".join(source.name for source in sources)
    else:
        command += [
            "-ss", f"{item['start']:.3f}", "-t", f"{duration:.6f}", "-i", str(item["path"]),
            "-vf", video_filter(index),
        ]
        detail = item["path"].name

    command += [
        "-an", "-r", str(base.FPS), "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
        str(target),
    ]
    print(f"[{index + 1:02d}/36] {item['kind']}: {detail}", flush=True)
    run(command)
    return target


def build(force: bool) -> tuple[Path, Path]:
    items = base.timeline()
    base.OUTPUT.mkdir(exist_ok=True)
    SEGMENTS.mkdir(parents=True, exist_ok=True)

    rendered = []
    for index, item in enumerate(items):
        duration = base.FIRST_DURATION if index == 0 else base.SEGMENT_DURATION
        rendered.append(render_segment(item, index, duration, force))

    concat_file = WORK / "concat.txt"
    concat_file.write_text("".join(f"file '{path}'\n" for path in rendered), encoding="utf-8")
    silent = WORK / "premium_silent_master.mp4"
    run([
        str(base.FFMPEG), "-hide_banner", "-loglevel", "warning", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(silent),
    ])

    run([
        str(base.FFMPEG), "-hide_banner", "-loglevel", "warning", "-y",
        "-i", str(silent), "-i", str(base.AUDIO), "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "44100", "-shortest",
        "-movflags", "+faststart", str(MASTER),
    ])

    run([
        str(base.FFMPEG), "-hide_banner", "-loglevel", "warning", "-y", "-i", str(MASTER),
        "-map", "0:v:0", "-map", "0:a:0", "-c:v", "libx264", "-preset", "medium",
        "-b:v", "12M", "-maxrate", "16M", "-bufsize", "24M", "-pix_fmt", "yuv420p",
        "-profile:v", "high", "-level", "4.1", "-colorspace", "bt709",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
        "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", str(INSTAGRAM),
    ])
    return MASTER, INSTAGRAM


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--clean", action="store_true")
    args = parser.parse_args()
    if args.clean and WORK.exists():
        shutil.rmtree(WORK)
    master, instagram = build(args.force)
    print(f"MASTER={master}")
    print(f"INSTAGRAM={instagram}")
