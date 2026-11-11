import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createAd, getAllCategories, uploadImage } from "../lib/firestore";
import type { AdType, Category } from "../types";
import { useAuth } from "../lib/auth-context";
import { useAppSettings } from "../lib/app-settings";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ImagePlus,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { LoginModal } from "../components/login-modal";

const DEFAULT_CITY = "Түймекент ауылы";

// Таңдалған санаттан түбірге дейінгі жолды жинайды: [түбір, ..., таңдалған]
function buildCategoryPath(categoryId: string, all: Category[]): string[] {
  const byId = new Map(all.map((item) => [item.id, item]));
  const visited = new Set<string>();
  const path: string[] = [];

  let currentId: string | null | undefined = categoryId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);

    const current = byId.get(currentId);
    if (!current) break;

    path.unshift(current.id);
    currentId = current.parentId;
  }

  return path.length > 0 ? path : [categoryId];
}

export default function PostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, theme, t } = useAppSettings();
  const isDark = theme === "dark";
  const isRu = language === "ru";

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [adType, setAdType] = useState<AdType>("sell");

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const text = {
    pageTitle: isRu ? "Добавить объявление" : "Хабарландыру жариялау",
    adType: isRu ? "Тип объявления" : "Хабарландыру түрі",
    moderation: isRu
      ? "Объявление сначала отправляется администратору на проверку."
      : "Хабарландыруыңыз алдымен әкімшінің тексеруіне жіберіледі.",
    image: isRu ? "Фото объявления *" : "Хабарландыру суреті *",
    chooseImage: isRu
      ? "Нажмите, чтобы выбрать изображение"
      : "Сурет таңдау үшін басыңыз",
    title: isRu ? "Название объявления *" : "Хабарландыру атауы *",
    titlePlaceholder: isRu
      ? "Например: iPhone 13 Pro"
      : "Мысалы: iPhone 13 Pro",
    category: isRu ? "Категория" : "Санат",
    chooseCategory: isRu
      ? "Выберите категорию"
      : "Санатты таңдаңыз",
    price: isRu ? "Цена (₸) *" : "Бағасы (₸) *",
    city: isRu ? "Город / Регион" : "Қала / Өңір",
    cityPlaceholder: isRu ? "Например: Актау" : "Мысалы: Ақтау",
    phone: isRu ? "Контактный телефон" : "Байланыс телефоны",
    description: isRu ? "Описание" : "Сипаттамасы",
    descriptionPlaceholder: isRu
      ? "Подробно опишите товар или услугу..."
      : "Зат туралы толығырақ жазыңыз...",
    submit: isRu ? "Отправить на публикацию" : "Жариялауға жіберу",
    required: isRu
      ? "Заполните обязательные поля и добавьте изображение"
      : "Міндетті өрістерді толтырып, сурет жүктеңіз",
    success: isRu
      ? "Объявление отправлено! Ожидается проверка администратора."
      : "Хабарландыру жіберілді! Әкімшінің тексеруі күтілуде.",
    error: isRu
      ? "Не удалось сохранить объявление"
      : "Хабарландыруды сақтау мүмкін болмады",
    back: isRu ? "Назад" : "Артқа",
  };

  const pageClass = isDark
    ? "min-h-screen bg-gray-950 text-gray-100"
    : "min-h-screen bg-gray-50 text-gray-900";

  const panelClass = isDark
    ? "border-gray-800 bg-gray-900"
    : "border-gray-200 bg-white";

  const mutedClass = isDark ? "text-gray-400" : "text-gray-500";

  const inputClass = isDark
    ? "border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-400"
    : "border-gray-200 bg-white text-gray-900";

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const result = await getAllCategories();

        if (!cancelled) {
          setCategories(result);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error(
          isRu
            ? "Не удалось загрузить категории"
            : "Санаттарды жүктеу мүмкін болмады",
        );
      }
    };

    void fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [isRu]);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        isRu ? "Выберите файл изображения" : "Сурет файлын таңдаңыз",
      );
      input.value = "";
      return;
    }

    try {
      const dataUrl = await uploadImage(file, "ads");
      setImageBase64(dataUrl);
    } catch (error: unknown) {
      console.error("Image conversion error:", error);

      toast.error(
        error instanceof Error && error.message
          ? error.message
          : isRu
            ? "Не удалось обработать изображение"
            : "Суретті өңдеу мүмкін болмады",
      );
    } finally {
      input.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast.info(t("signInRequired"));
      setIsLoginOpen(true);
      return;
    }

    if (!title.trim() || !price.trim() || !imageBase64) {
      toast.error(text.required);
      return;
    }

    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error(
        isRu ? "Укажите корректную цену" : "Бағаны дұрыс енгізіңіз",
      );
      return;
    }

    setLoading(true);

    try {
      await createAd({
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        adType,
        categoryPath: category ? buildCategoryPath(category, categories) : [],
        images: [imageBase64],
        city: city.trim() || DEFAULT_CITY,
        ownerName: user.name,
        phone: phone.trim(),
        userId: user.uid,
      });

      toast.success(text.success);
      navigate("/");
    } catch (error: unknown) {
      console.error("Error posting ad:", error);

      const message =
        error instanceof Error ? error.message : text.error;

      toast.error(`${text.error}: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${pageClass} px-4 py-6 pb-24`}>
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={text.back}
            onClick={() => navigate(-1)}
            className={
              isDark
                ? "text-gray-200 hover:bg-gray-800"
                : "text-gray-700"
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <h1 className="text-2xl font-bold">{text.pageTitle}</h1>
        </div>

        <p className={`mb-6 text-sm ${mutedClass}`}>
          {text.moderation}
        </p>

        <form
          onSubmit={handleSubmit}
          className={`space-y-6 rounded-2xl border p-4 sm:p-6 ${panelClass}`}
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              {text.adType}
            </label>

            <div
              className={`grid grid-cols-2 gap-2 rounded-xl p-1 ${
                isDark ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              {(["sell", "buy"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAdType(type)}
                  className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                    adType === type
                      ? isDark
                        ? "bg-gray-700 text-blue-300 shadow-sm"
                        : "bg-white text-blue-600 shadow-sm"
                      : isDark
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t(type)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {text.image}
            </label>

            {imageBase64 ? (
              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700">
                <img
                  src={imageBase64}
                  alt={isRu ? "Предпросмотр изображения" : "Сурет көрінісі"}
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => setImageBase64(null)}
                  aria-label={isRu ? "Удалить изображение" : "Суретті өшіру"}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition hover:bg-black/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                className={`flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${
                  isDark
                    ? "border-gray-700 bg-gray-800/50 hover:bg-gray-800"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <ImagePlus className="mb-2 h-10 w-10 text-gray-400" />
                <span className={`text-sm ${mutedClass}`}>
                  {text.chooseImage}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {text.title}
            </label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={text.titlePlaceholder}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {text.category}
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder={text.chooseCategory} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name || cat.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {text.price}
            </label>
            <Input
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="15000"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {text.city}
            </label>
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder={text.cityPlaceholder}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {text.phone}
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+7 (700) 000-00-00"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {text.description}
            </label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={text.descriptionPlaceholder}
              rows={4}
              className={inputClass}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("loading")}
              </>
            ) : (
              text.submit
            )}
          </Button>
        </form>
      </div>

      <LoginModal
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
    }
