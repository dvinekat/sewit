"""
Генерация статической OG-картинки public/og.png (1200×630).

Запуск (Windows):
    python scripts/generate-og.py

Скрипт использует системные шрифты Georgia и Segoe UI, потому что next/font
не тянем: сборка не должна зависеть от загрузки шрифтов из сети.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og.png"

PAPER = (251, 248, 243)
INK = (33, 29, 25)
TERRACOTTA = (168, 69, 31)
MUTED = (107, 98, 89)

FONTS = Path("C:/Windows/Fonts")
GEORGIA = FONTS / "georgia.ttf"
GEORGIA_BOLD = FONTS / "georgiab.ttf"
GEORGIA_ITALIC = FONTS / "georgiai.ttf"
SEGOE = FONTS / "segoeui.ttf"
SEGOE_BOLD = FONTS / "segoeuib.ttf"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def main() -> None:
    width, height = 1200, 630
    image = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(image)

    # Декоративные окружности справа: тонкие, не мешают тексту.
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ring = ImageDraw.Draw(overlay)
    ring.ellipse((930, -140, 1410, 340), outline=(168, 69, 31, 38), width=2)
    ring.ellipse((1010, 120, 1330, 440), outline=(168, 69, 31, 30), width=2)
    ring.ellipse((820, 430, 980, 590), outline=(168, 69, 31, 22), width=2)
    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(image)

    # Логотип: терракотовый квадрат со скруглением и белая «S».
    draw.rounded_rectangle((96, 76, 188, 168), radius=22, fill=TERRACOTTA)
    logo_font = font(GEORGIA_BOLD, 64)
    draw.text((142, 122), "S", font=logo_font, fill=PAPER, anchor="mm")

    draw.text((212, 100), "SewIt", font=font(GEORGIA_BOLD, 56), fill=INK)
    draw.text(
        (214, 158),
        "ВЫКРОЙКИ ПО МЕРКАМ",
        font=font(SEGOE_BOLD, 19),
        fill=MUTED,
    )

    # Заголовок.
    draw.text(
        (96, 250),
        "Выкройки, которые садятся",
        font=font(GEORGIA, 62),
        fill=INK,
    )
    draw.text(
        (96, 330),
        "по вашей фигуре",
        font=font(GEORGIA_ITALIC, 62),
        fill=TERRACOTTA,
    )

    # Подпись и нижняя строка.
    draw.text(
        (96, 452),
        "Подбор размера по меркам, пресеты модели и лекала PDF A4",
        font=font(SEGOE, 27),
        fill=MUTED,
    )

    draw.line((96, 535, 1104, 535), fill=(231, 223, 212), width=2)
    draw.text(
        (96, 562),
        "Новая коллекция · 2026",
        font=font(SEGOE, 21),
        fill=MUTED,
    )
    draw.text((1104, 562), "sewit", font=font(SEGOE_BOLD, 21), fill=TERRACOTTA, anchor="ra")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUT, format="PNG", optimize=True)
    print(f"Готово: {OUT} ({OUT.stat().st_size} байт)")


if __name__ == "__main__":
    main()
