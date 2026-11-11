
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Trash2,
  X,
  Palette,
  Folder,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import * as Icons from "lucide-react";
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
  type Category,
} from "../../lib/firestore";
import { toast } from "sonner";
import { IconPicker } from "./icon-picker";

type CategoryLevel = {
  parentId: string | null;
  parentName: string;
  categories: Category[];
};

export function CategoryManager() {
  const [stack, setStack] = useState<CategoryLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formNameRu, setFormNameRu] = useState("");
  const [formIcon, setFormIcon] = useState("Folder");
  const [formColor, setFormColor] = useState("#3B82F6");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const current = stack[stack.length - 1];

  const loadRoot = useCallback(async () => {
    setLoading(true);
    try {
      const categories = await getCategories(null);
      setStack([
        {
          parentId: null,
          parentName: "Басты бөлімдер",
          categories,
        },
      ]);
    } catch (error) {
      console.error(error);
      toast.error("Бөлімдерді жүктеу мүмкін болмады");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoot();
  }, [loadRoot]);

  const refreshCurrent = async () => {
    const currentLevel = stack[stack.length - 1];
    if (!currentLevel) return;

    const categories = await getCategories(currentLevel.parentId);

    setStack((previous) =>
      previous.map((level, index) =>
        index === previous.length - 1
          ? { ...level, categories }
          : level,
      ),
    );
  };

  const navigateInto = async (category: Category) => {
    setLoading(true);
    try {
      const children = await getCategories(category.id);
      setStack((previous) => [
        ...previous,
        {
          parentId: category.id,
          parentName: category.name,
          categories: children,
        },
      ]);
    } catch (error) {
      console.error(error);
      toast.error("Ішкі бөлімдерді ашу мүмкін болмады");
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => {
    setStack((previous) =>
      previous.length > 1 ? previous.slice(0, -1) : previous,
    );
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormNameRu("");
    setFormIcon("Folder");
    setFormColor("#3B82F6");
    setShowIconPicker(false);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormName(category.nameKk || category.name);
    setFormNameRu(category.nameRu || "");
    setFormIcon(category.icon || "Folder");
    setFormColor(category.color || "#3B82F6");
    setShowForm(true);
  };

  const handleSave = async () => {
    const name = formName.trim();

    if (!name) {
      toast.error("Бөлімнің атауын енгізіңіз");
      return;
    }

    if (!current || saving) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, {
          name,
          nameKk: name,
          nameRu: formNameRu.trim() || name,
          icon: formIcon,
          color: formColor,
        });
        toast.success("Бөлім жаңартылды");
      } else {
        await createCategory({
          name,
          nameKk: name,
          nameRu: formNameRu.trim() || name,
          parentId: current.parentId,
          icon: formIcon,
          color: formColor,
          order: current.categories.length,
          active: true,
        });
        toast.success("Жаңа бөлім қосылды");
      }

      await refreshCurrent();
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Сақтау мүмкін болмады");
    } finally {
      setSaving(false);
    }
  };

  const deleteTree = async (categoryId: string): Promise<void> => {
    const children = await getCategories(categoryId);

    for (const child of children) {
      await deleteTree(child.id);
    }

    await deleteCategory(categoryId);
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `«${category.name}» бөлімін және оның ішкі бөлімдерін жоясыз ба? Бұл әрекет қайтарылмайды.`,
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteTree(category.id);
      await refreshCurrent();
      toast.success("Бөлім және оның ішкі бөлімдері жойылды");
    } catch (error) {
      console.error(error);
      toast.error("Бөлімді жою мүмкін болмады");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      await updateCategory(category.id, {
        active: category.active === false,
      });
      await refreshCurrent();
      toast.success(
        category.active === false
          ? "Бөлім белсенді етілді"
          : "Бөлім жасырылды",
      );
    } catch (error) {
      console.error(error);
      toast.error("Бөлім күйін өзгерту мүмкін болмады");
    }
  };

  const moveCategory = async (
    category: Category,
    direction: -1 | 1,
  ) => {
    if (!current) return;

    const sorted = [...current.categories].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    const index = sorted.findIndex((item) => item.id === category.id);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) return;

    const other = sorted[nextIndex];

    try {
      await Promise.all([
        updateCategory(category.id, { order: nextIndex }),
        updateCategory(other.id, { order: index }),
      ]);

      await refreshCurrent();
    } catch (error) {
      console.error(error);
      toast.error("Бөлімдердің ретін өзгерту мүмкін болмады");
    }
  };

  const getIcon = (iconName: string) => {
    const iconMap = Icons as unknown as Record<
      string,
      React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    >;

    return iconMap[iconName] || Icons.Folder;
  };

  if (loading && stack.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-500">Жүктелуде...</p>
      </div>
    );
  }

  return (
    <div className="text-slate-900">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {stack.length > 1 && (
            <button
              type="button"
              onClick={navigateBack}
              aria-label="Артқа"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white hover:bg-slate-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className="min-w-0">
            <h3 className="truncate text-lg font-black">
              {current?.parentName || "Бөлімдер"}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
              {stack.map((level, index) => (
                <span key={`${level.parentId}-${index}`} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3" />}
                  {level.parentName}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg"
        >
          <Plus className="h-4 w-4" />
          ҚОСУ
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="space-y-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <h4 className="font-black">
                  {editingId ? "Бөлімді өңдеу" : "Жаңа бөлім қосу"}
                </h4>
                <button type="button" onClick={resetForm} aria-label="Жабу">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <input
                type="text"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder="Бөлім атауы..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
              />

              <input
                type="text"
                value={formNameRu}
                onChange={(event) => setFormNameRu(event.target.value)}
                placeholder="Название раздела (русский)..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowIconPicker((value) => !value)}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border bg-white p-3"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {(() => {
                      const Icon = getIcon(formIcon);
                      return (
                        <Icon
                          className="h-5 w-5 shrink-0"
                          style={{ color: formColor }}
                        />
                      );
                    })()}
                    <span className="truncate text-sm font-bold">{formIcon}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>

                <label className="flex items-center gap-3 rounded-2xl border bg-white p-3">
                  <Palette className="h-5 w-5 shrink-0 text-slate-500" />
                  <input
                    type="color"
                    value={formColor}
                    onChange={(event) => setFormColor(event.target.value)}
                    aria-label="Бөлім түсі"
                    className="h-7 min-w-0 flex-1 cursor-pointer"
                  />
                </label>
              </div>

              {showIconPicker && (
                <div className="rounded-2xl border bg-white p-2">
                  <IconPicker
                    selected={formIcon}
                    onSelect={(icon: string) => {
                      setFormIcon(icon);
                      setShowIconPicker(false);
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-2xl border bg-white py-3 font-bold"
                >
                  Болдырмау
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 font-black text-white disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "САҚТАУ" : "ҚОСУ"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && stack.length > 0 ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : !current || current.categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-14 text-center">
          <Folder className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-bold text-slate-500">Бұл жерде бөлім жоқ</p>
          <p className="mt-1 text-xs text-slate-400">
            «Қосу» батырмасын басып жаңа бөлім жасаңыз
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...current.categories]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((category, index, sorted) => {
              const Icon = getIcon(category.icon || "Folder");
              const hidden = category.active === false;

              return (
                <div
                  key={category.id}
                  className={`flex items-center gap-3 rounded-3xl border bg-white p-3 shadow-sm ${
                    hidden ? "opacity-60" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void navigateInto(category)}
                    title="Ішкі бөлімдерді ашу"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${category.color || "#3B82F6"}18` }}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: category.color || "#3B82F6" }}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => void navigateInto(category)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block break-words text-sm font-black">
                      {category.name}
                    </span>
                    <span className="mt-1 block text-[10px] font-bold text-slate-400">
                      {hidden ? "Жасырылған" : "Белсенді"} · Реті: {category.order ?? index}
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => void moveCategory(category, -1)}
                      disabled={index === 0}
                      title="Жоғары жылжыту"
                      aria-label="Жоғары жылжыту"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-25"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void moveCategory(category, 1)}
                      disabled={index === sorted.length - 1}
                      title="Төмен жылжыту"
                      aria-label="Төмен жылжыту"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-25"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void toggleActive(category)}
                      title={hidden ? "Белсенді ету" : "Жасыру"}
                      aria-label={hidden ? "Белсенді ету" : "Жасыру"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      {hidden ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(category)}
                      title="Өңдеу"
                      aria-label="Өңдеу"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(category)}
                      title="Жою"
                      aria-label="Жою"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void navigateInto(category)}
                      title="Ішкі бөлімдер"
                      aria-label="Ішкі бөлімдерді ашу"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
