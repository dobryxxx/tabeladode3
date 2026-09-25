from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ASSETS = Path(r"C:\Users\Cliente\Desktop\tabeladode3\fotos td3\preloader")
VIDEOS = ASSETS / "videos_instagram"
OUTPUT = ASSETS / "output"
WORK = ROOT / "_reels_build"
FFMPEG = ROOT / ".tools" / "video" / "imageio_ffmpeg" / "binaries" / "ffmpeg-win-x86_64-v7.1.exe"
AUDIO = ASSETS / "trilha.wav"
FONT = Path(r"C:\Windows\Fonts\impact.ttf")

FPS = 24
WIDTH = 1080
HEIGHT = 1920
BEAT = 60.0 / 74.90
FIRST_DURATION = 0.348 + 4 * BEAT
SEGMENT_DURATION = 4 * BEAT


def photo(name: str, text: str | None = None, subtitle: str | None = None):
    return {"kind": "photo", "path": ASSETS / name, "text": text, "subtitle": subtitle}


def video(marker: str, start: float):
    matches = sorted(VIDEOS.glob(f"*_{marker}_*.mp4"))
    if len(matches) != 1:
        raise RuntimeError(f"Expected one video for {marker}, found {len(matches)}")
    return {"kind": "video", "path": matches[0], "start": start}


PNG_1 = "dobrychtop_black_and_white_documentary_basketball_photograph__1a6162f9-c2a2-4002-a080-c140989ea547_1.png"
PNG_2 = "dobrychtop_black_and_white_documentary_basketball_photograph__c3a0968f-7d63-4cbe-8bb2-07a52bcf5985_2.png"
PNG_3 = "dobrychtop_black_and_white_documentary_sports_photograph_of_a_09ea9e6a-bd49-4240-90fe-201f8a943a6f_3.png"
PNG_4 = "dobrychtop_black_and_white_heroic_documentary_basketball_phot_52907a9f-2dab-422a-80a9-a772ae1e08c0_1.png"
PNG_5 = "dobrychtop_black_and_white_heroic_documentary_basketball_phot_52907a9f-2dab-422a-80a9-a772ae1e08c0_2.png"


def timeline():
    # 36 four-beat chapters. The first cut lands on the first strong four-beat boundary.
    # The newest Reel is intentionally restricted to its first ten seconds.
    return [
        photo("TABELADO.jpg", "TABELADO DE 3", "CAMPANHA DE LANCAMENTO"),
        video("DW7g-VckSnM", 0.0),
        photo("1.jpg"),
        video("DW7g-VckSnM", 3.2),
        photo("7.jpg"),
        video("DW7g-VckSnM", 6.6),
        photo("19.jpg"),
        video("DS5Eh4gkQts", 2.0),
        photo("6.jpg"),
        video("DTGqBT5kURq", 8.5),
        photo("TABELADO2.jpg"),
        video("DTgp017EWmy", 18.0),
        photo("8.jpg"),
        video("DS5Eh4gkQts", 11.5),
        photo("4.jpg"),
        video("DTGqBT5kURq", 15.5),
        photo(PNG_1),
        photo("TABELADO.jpg"),
        video("DTgp017EWmy", 49.5),
        photo("Gemini_Generated_Image_um7cuaum7cuaum7c.jpg"),
        video("DS5Eh4gkQts", 26.5),
        photo(PNG_2),
        video("DTGqBT5kURq", 25.5),
        photo("20.jpg"),
        photo("TABELADO2.jpg"),
        video("DTgp017EWmy", 59.5),
        photo("9.jpg"),
        video("DS5Eh4gkQts", 5.5),
        photo(PNG_3),
        video("DTGqBT5kURq", 0.0),
        photo("11.jpg"),
        video("DTgp017EWmy", 7.5),
        photo(PNG_4),
        photo("TABELADO.jpg", "TABELADO DE 3"),
        photo(PNG_5),
        photo("TABELADO2.jpg", "TABELADO DE 3", "LANCAMENTO"),
    ]


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def text_filters(item: dict, final: bool) -> list[str]:
    filters: list[str] = []
    font = str(FONT).replace("\\", "/").replace(":", r"\:")
    if item.get("text"):
        filters.append(
            "drawtext="
            f"fontfile='{font}':text='{item['text']}':"
            "fontcolor=white:fontsize=112:"
            "x=(w-text_w)/2:y=h-330:"
            "box=1:boxcolor=black@0.70:boxborderw=28"
        )
    if item.get("subtitle"):
        filters.append(
            "drawtext="
            f"fontfile='{font}':text='{item['subtitle']}':"
            "fontcolor=white:fontsize=46:"
            "x=(w-text_w)/2:y=h-170:"
            "box=1:boxcolor=black@0.70:boxborderw=18"
        )
    if final:
        filters.append("fade=t=out:st=2.55:d=0.65:color=black")
    return filters


def make_filter(item: dict, index: int, duration: float, final: bool) -> str:
    phase = (index * 0.73) % 6.0
    common = [
        "hue=s=0",
        "eq=contrast=1.18:brightness=-0.025:gamma=0.96",
        "unsharp=5:5:0.55:3:3:0.25",
        "noise=alls=10:allf=t+u",
        "vignette=angle=PI/5",
    ]
    if item["kind"] == "photo":
        # Overscan plus animated crop gives stills a handheld, forward-moving feel.
        movement = [
            f"fps={FPS}",
            "scale=1188:2112:force_original_aspect_ratio=increase",
            (
                "crop=1080:1920:"
                f"x='max(0,min(iw-ow,(iw-ow)/2+(iw-ow)*0.28*sin(t*0.62+{phase:.3f})))':"
                f"y='max(0,min(ih-oh,(ih-oh)/2+(ih-oh)*0.38*cos(t*0.48+{phase:.3f})))'"
            ),
            "tmix=frames=3:weights='1 2 1'",
        ]
    else:
        movement = [
            f"fps={FPS}",
            "scale=1080:1920:force_original_aspect_ratio=increase",
            "crop=1080:1920",
            "tmix=frames=3:weights='1 2 1'",
        ]

    filters = movement + common
    if index in {0, 5, 10, 17, 24, 33, 35}:
        filters.append("fade=t=in:st=0:d=0.10:color=white")
    if item["kind"] == "photo" and index in {0, 10, 17, 24, 33, 35}:
        filters.append("drawbox=x=52:y=52:w=976:h=1816:color=white@0.30:t=3")
    filters.extend(text_filters(item, final))
    filters.extend(["setsar=1", "format=yuv420p"])
    return ",".join(filters)


def render_segment(item: dict, index: int, duration: float, force: bool) -> Path:
    target = WORK / "segments" / f"segment_{index:02d}.mp4"
    if target.exists() and not force:
        return target

    command = [str(FFMPEG), "-hide_banner", "-loglevel", "warning", "-y"]
    if item["kind"] == "photo":
        command += ["-loop", "1", "-framerate", str(FPS), "-t", f"{duration:.6f}", "-i", str(item["path"])]
    else:
        command += [
            "-ss", f"{item['start']:.3f}",
            "-t", f"{duration:.6f}",
            "-i", str(item["path"]),
        ]
    command += [
        "-vf", make_filter(item, index, duration, index == 35),
        "-an",
        "-r", str(FPS),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-profile:v", "high",
        "-level", "4.1",
        str(target),
    ]
    print(f"[{index + 1:02d}/36] {item['kind']}: {item['path'].name}", flush=True)
    run(command)
    return target


def build(force: bool) -> Path:
    if not FFMPEG.exists():
        raise FileNotFoundError(FFMPEG)
    if not AUDIO.exists():
        raise FileNotFoundError(AUDIO)

    items = timeline()
    WORK.mkdir(exist_ok=True)
    (WORK / "segments").mkdir(exist_ok=True)
    OUTPUT.mkdir(exist_ok=True)

    rendered = []
    for index, item in enumerate(items):
        if not item["path"].exists():
            raise FileNotFoundError(item["path"])
        duration = FIRST_DURATION if index == 0 else SEGMENT_DURATION
        rendered.append(render_segment(item, index, duration, force))

    concat_file = WORK / "concat.txt"
    concat_file.write_text(
        "".join(f"file '{str(path).replace(chr(39), chr(39) + chr(92) + chr(39) + chr(39))}'\n" for path in rendered),
        encoding="utf-8",
    )
    silent = WORK / "tabelado_silent_master.mp4"
    run([
        str(FFMPEG), "-hide_banner", "-loglevel", "warning", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_file),
        "-c", "copy", str(silent),
    ])

    final = OUTPUT / "TABELADO_DE_3_REELS_LANCAMENTO_9x16.mp4"
    run([
        str(FFMPEG), "-hide_banner", "-loglevel", "warning", "-y",
        "-i", str(silent), "-i", str(AUDIO),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "320k",
        "-ar", "44100", "-shortest", "-movflags", "+faststart",
        str(final),
    ])
    return final


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="re-render every segment")
    parser.add_argument("--clean", action="store_true", help="remove intermediate renders first")
    args = parser.parse_args()
    if args.clean and WORK.exists():
        shutil.rmtree(WORK)
    result = build(args.force)
    print(f"FINAL={result}")
