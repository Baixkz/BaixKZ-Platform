// ==========================================
// BAIX KZ — суретті өңдеу
// Суретті кішірейтіп, JPEG мәтіні (data URL) түрінде қайтарады.
// Нәтиже Firestore құжатына тікелей жазылады (Storage қажет емес).
// ==========================================

export interface CompressOptions {
  // Ұзын қабырғаның ең үлкен өлшемі (пиксель)
  maxSize?: number;
  // JPEG сапасы, 0-ден 1-ге дейін
  quality?: number;
  // Нәтиже мәтінінің ең үлкен ұзындығы (Firestore құжат лимиті 1 МБ)
  maxLength?: number;
}

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_ATTEMPTS = 4;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Суретті ашу мүмкін болмады"));
    };

    image.src = objectUrl;
  });
}

function renderToDataUrl(
  image: HTMLImageElement,
  maxSize: number,
  quality: number,
): string {
  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;

  const longestSide = Math.max(width, height);

  if (longestSide > maxSize) {
    const scale = maxSize / longestSide;
    width = width * scale;
    height = height * scale;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Суретті өңдеу мүмкін болмады");
  }

  // Мөлдір PNG JPEG-ке айналғанда қара болмауы үшін ақ фон
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", quality);
}

export async function compressImageToDataUrl(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  const { maxSize = 1000, quality = 0.7, maxLength = 700_000 } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("Сурет файлын таңдаңыз");
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Сурет тым үлкен (15 МБ-тан аспауы керек)");
  }

  const image = await loadImage(file);

  let currentSize = maxSize;
  let currentQuality = quality;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const dataUrl = renderToDataUrl(image, currentSize, currentQuality);

    if (dataUrl.length <= maxLength) {
      return dataUrl;
    }

    // Тым үлкен болса, өлшемі мен сапасын азайтып қайталаймыз
    currentSize = Math.round(currentSize * 0.8);
    currentQuality = Math.max(0.4, currentQuality - 0.1);
  }

  throw new Error("Сурет тым үлкен, басқа сурет таңдаңыз");
}

