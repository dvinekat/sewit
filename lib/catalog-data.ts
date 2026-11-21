import type {
  Category,
  ParamCode,
  Pattern,
  PatternParam,
  PatternParamValue,
  PatternSize,
} from "./pattern-domain";

/**
 * Каталог SewIt: модели, категории, размеры и параметры.
 * Данные инкапсулированы за функциями в `lib/patterns.ts`; при подключении БД
 * этот файл останется локальным набором для разработки и тестов.
 */

export const catalogCategories: Category[] = [
  {
    slug: "dresses",
    title: "Платья",
    description: "От платья-рубашки до комбинации — на каждый день и для выхода.",
  },
  {
    slug: "skirts",
    title: "Юбки",
    description: "Прямые, расклешённые и с разрезом — база гардероба.",
  },
  {
    slug: "trousers",
    title: "Брюки",
    description: "Свободные палаццо и модели с посадкой по фигуре.",
  },
  {
    slug: "tops",
    title: "Топы",
    description: "Лёгкие топы и блузы, которые шьются за вечер.",
  },
  {
    slug: "outerwear",
    title: "Верхняя одежда",
    description: "Худи и лёгкая верхняя одежда оверсайз.",
  },
];

const SIZE_BASE: ReadonlyArray<Omit<PatternSize, "fabricConsumptionM">> = [
  { label: "42", bust: 84, waist: 66, hips: 92, heightMin: 158, heightMax: 168 },
  { label: "44", bust: 88, waist: 70, hips: 96, heightMin: 159, heightMax: 169 },
  { label: "46", bust: 92, waist: 74, hips: 100, heightMin: 160, heightMax: 170 },
  { label: "48", bust: 96, waist: 78, hips: 104, heightMin: 161, heightMax: 171 },
  { label: "50", bust: 100, waist: 82, hips: 108, heightMin: 162, heightMax: 172 },
];

/** Пять размеров 42/44/46/48/50 с разным расходом ткани. */
function makeSizes(consumption: readonly [number, number, number, number, number]): PatternSize[] {
  return SIZE_BASE.map((size, index) => ({
    ...size,
    fabricConsumptionM: consumption[index],
  }));
}

function available(value: string, title: string): PatternParamValue {
  return { value, title, available: true };
}

function param(code: ParamCode, title: string, values: PatternParamValue[]): PatternParam {
  return { code, title, values };
}

/** Переиспользуемые наборы параметров из README 9. */
const LENGTH_MIDI_MAXI = () =>
  param("length", "Длина", [available("midi", "Midi"), available("maxi", "Maxi")]);
const SLEEVE_SHORT_LONG = () =>
  param("sleeve", "Рукав", [available("short", "Короткий"), available("long", "Длинный")]);
const NECKLINE_ROUND_V = () =>
  param("neckline", "Вырез", [available("round", "Круглый"), available("v", "V-образный")]);
const FIT_FITTED_OVERSIZE = () =>
  param("fit", "Посадка", [available("fitted", "По фигуре"), available("oversize", "Оверсайз")]);

export const catalogPatterns: Pattern[] = [
  {
    id: "p-dress-shirt",
    slug: "dress-shirt",
    title: "Платье-рубашка",
    description:
      "Свободное платье с отложным воротником, планкой и накладными карманами. Длина midi или maxi, рукав на выбор — от короткого до длинного.",
    categorySlug: "dresses",
    level: 3,
    sewingHours: 6,
    fabricNote: "Плотный хлопок, лён или тенсел: ткань держит форму воротника и не просвечивает.",
    materials: [
      "2,5 м основной ткани при ширине 140 см",
      "Флизелин для воротника и планки",
      "6 пуговиц 12 мм",
      "Нитки в тон",
    ],
    allowances: "1 см по всем срезам, 3 см по низу и низу рукава. Припуски уже в лекалах.",
    price: 249000,
    coverUrl: null,
    model3dUrl: null,
    status: "published",
    salesCount: 128,
    createdAt: "2026-10-02",
    publishedAt: "2026-10-05",
    sizes: makeSizes([2.2, 2.35, 2.5, 2.65, 2.8]),
    params: [LENGTH_MIDI_MAXI(), SLEEVE_SHORT_LONG()],
  },
  {
    id: "p-skirt-slit",
    slug: "skirt-slit",
    title: "Прямая юбка с разрезом",
    description:
      "Юбка на притачном поясе с разрезом сзади. Держит форму, но не сковывает шаг; длина mini или midi.",
    categorySlug: "skirts",
    level: 1,
    sewingHours: 3,
    fabricNote: "Костюмная шерсть, вискоза или плотный деним.",
    materials: [
      "1,2 м ткани при ширине 140 см",
      "Потайная молния 20 см",
      "Клеевой пояс",
      "Нитки в тон",
    ],
    allowances: "1 см по боковым швам, 3 см по низу. Припуски уже в лекалах.",
    price: 149000,
    coverUrl: null,
    model3dUrl: null,
    status: "published",
    salesCount: 96,
    createdAt: "2026-09-18",
    publishedAt: "2026-09-20",
    sizes: makeSizes([1.1, 1.15, 1.2, 1.3, 1.4]),
    params: [param("length", "Длина", [available("mini", "Mini"), available("midi", "Midi")])],
  },
  {
    id: "p-trousers-palazzo",
    slug: "trousers-palazzo",
    title: "Брюки-палаццо",
    description:
      "Широкие брюки с завышенной посадкой и мягкими складками от пояса. Скрытая молния и карманы в боковых швах.",
    categorySlug: "trousers",
    level: 3,
    sewingHours: 5,
    fabricNote: "Вискоза, лён или струящийся полиэстер.",
    materials: [
      "2,6 м ткани при ширине 140 см",
      "Потайная молния 18 см",
      "Клеевой пояс",
      "Нитки в тон",
    ],
    allowances: "1 см по швам, 3 см по низу. Припуски уже в лекалах.",
    price: 189000,
    coverUrl: null,
    model3dUrl: null,
    status: "published",
    salesCount: 88,
    createdAt: "2026-10-11",
    publishedAt: "2026-10-12",
    sizes: makeSizes([2.4, 2.5, 2.6, 2.75, 2.9]),
    params: [FIT_FITTED_OVERSIZE()],
  },
  {
    id: "p-top-puff",
    slug: "top-puff",
    title: "Топ с рукавом-фонариком",
    description:
      "Топ с круглым или V-образным вырезом и рукавом-фонариком на манжете. Быстрый проект для первой пробы.",
    categorySlug: "tops",
    level: 2,
    sewingHours: 3,
    fabricNote: "Хлопковый поплин, вискоза или лёгкий лён.",
    materials: ["1,1 м ткани", "Резинка 1 см для манжет", "Нитки в тон"],
    allowances: "1 см по швам, 2 см по низу. Припуски уже в лекалах.",
    price: 129000,
    coverUrl: null,
    model3dUrl: null,
    status: "published",
    salesCount: 74,
    createdAt: "2026-09-30",
    publishedAt: "2026-10-01",
    sizes: makeSizes([1.0, 1.05, 1.1, 1.15, 1.2]),
    params: [NECKLINE_ROUND_V()],
  },
  {
    id: "p-hoodie-oversize",
    slug: "hoodie-oversize",
    title: "Худи оверсайз",
    description:
      "Худи с капюшоном, спущенной проймой и карманом-кенгуру. Свободная посадка, мягкий трикотаж и регулируемая длина.",
    categorySlug: "outerwear",
    level: 4,
    sewingHours: 7,
    fabricNote: "Футер двунитка или плотный флис.",
    materials: ["2,2 м футера", "Резинка 5 см для манжет и пояса", "Шнурок 1,5 м", "Нитки в тон"],
    allowances: "1 см по швам, 2,5 см по низу. Припуски уже в лекалах.",
    price: 219000,
    coverUrl: null,
    model3dUrl: null,
    status: "published",
    salesCount: 112,
    createdAt: "2026-10-20",
    publishedAt: "2026-10-21",
    sizes: makeSizes([2.0, 2.1, 2.2, 2.35, 2.5]),
    params: [
      param("length", "Длина", [
        available("cropped", "Укороченная"),
        available("regular", "Стандартная"),
      ]),
      SLEEVE_SHORT_LONG(),
    ],
  },
  {
    id: "p-slip-dress",
    slug: "slip-dress",
    title: "Платье-комбинация",
    description:
      "Платье по косой с тонкими бретелями и мягкой драпировкой. Длина midi или maxi, вырез V или лодочка.",
    categorySlug: "dresses",
    level: 2,
    sewingHours: 4,
    fabricNote: "Атлас, вискозный креп или шёлк. Проверьте драпируемость и осыпаемость.",
    materials: [
      "1,8 м ткани при ширине 145 см",
      "Косая бейка для обработки выреза",
      "Регуляторы для бретелей",
      "Нитки в тон",
    ],
    allowances: "1 см по швам, 2 см по низу. Припуски уже в лекалах.",
    price: 229000,
    coverUrl: null,
    model3dUrl: null,
    status: "published",
    salesCount: 67,
    createdAt: "2026-10-28",
    publishedAt: "2026-10-29",
    sizes: makeSizes([1.6, 1.7, 1.8, 1.9, 2.0]),
    params: [
      LENGTH_MIDI_MAXI(),
      param("neckline", "Вырез", [
        available("v", "V-образный"),
        { value: "boat", title: "Лодочка", available: false },
      ]),
    ],
  },
  {
    id: "p-dress-back",
    slug: "dress-back",
    title: "Платье с открытой спиной",
    description:
      "Платье с открытой спиной и мягкой драпировкой по спинке. Модель готовится к публикации в каталоге.",
    categorySlug: "dresses",
    level: 4,
    sewingHours: 7,
    fabricNote: "Креп или вискоза.",
    materials: ["2,0 м ткани", "Потайная молния", "Нитки в тон"],
    allowances: "1 см по швам, 2 см по низу.",
    price: 259000,
    coverUrl: null,
    model3dUrl: null,
    status: "draft",
    salesCount: 0,
    createdAt: "2026-11-10",
    publishedAt: null,
    sizes: makeSizes([1.9, 2.0, 2.1, 2.25, 2.4]),
    params: [LENGTH_MIDI_MAXI()],
  },
];
