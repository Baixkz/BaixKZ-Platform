import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Save, Eye, EyeOff, Image, Link, Edit2 } from "lucide-react";
import { getBanners, createBanner, updateBanner, deleteBanner, uploadImage, type Banner } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

export function BannerManager() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLink, setFormLink] = useState("");
  const [formPage, setFormPage] = useState<"home" | "posting" | "profile">("home");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await getBanners();
      setBanners(data as Banner[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Өзгерту режимін іске қосу (Бұл функция сізде жетіспеді)
  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormLink(banner.link || "");
    setFormPage(banner.page as any || "home");
    setFormPreview(banner.imageUrl);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFormPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Егер жаңа баннер болса және сурет таңдалмаса қате шығару
    if (!editingId && !formFile) {
      toast({ title: "Сурет таңдаңыз", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = "";
      if (formFile) {
        imageUrl = await uploadImage(formFile, `banners/${Date.now()}_${formFile.name}`);
      }

      if (editingId) {
        const updateData: Partial<Banner> = { 
          link: formLink, 
          page: formPage 
        };
        if (imageUrl) updateData.imageUrl = imageUrl;
        
        await updateBanner(editingId, updateData);
        toast({ title: "Баннер жаңартылды" });
      } else {
        await createBanner({
          imageUrl,
          link: formLink,
          page: formPage,
          order: banners.length,
          active: true,
        });
        toast({ title: "Баннер қосылды" });
      }
      await loadBanners();
      resetForm();
    } catch (e: any) {
      toast({ title: e.message || "Қате", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await updateBanner(id, { active });
      await loadBanners();
    } catch (e: any) {
      toast({ title: e.message || "Қате", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Баннерді жою?")) return;
    try {
      await deleteBanner(id);
      toast({ title: "Баннер жойылды" });
      await loadBanners();
    } catch (e: any) {
      toast({ title: e.message || "Қате", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormLink("");
    setFormPage("home");
    setFormFile(null);
    setFormPreview("");
  };

  const pageLabels: Record<string, string> = {
    home: "Басты бет",
    posting: "Жарнама бет",
    profile: "Профиль бет",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Баннерлер ({banners.length})</h3>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3 h-3" /> Қосу
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{editingId ? "Өзгерту" : "Жаңа баннер"}</h4>
                <button onClick={resetForm} className="hover:bg-muted p-1 rounded-full transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Сурет</label>
                {formPreview ? (
                  <div className="relative aspect-[2.5/1] rounded-lg overflow-hidden mb-2 border border-border">
                    <img src={formPreview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setFormFile(null); setFormPreview(""); }}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Image className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Сурет таңдау</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Сілтеме (URL)</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-xs outline-none focus:ring-1 ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Бет</label>
                <div className="flex gap-1.5">
                  {(["home", "posting", "profile"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFormPage(p)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        formPage === p ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {pageLabels[p]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {uploading ? "Жүктелуде..." : editingId ? "Сақтау" : "Қосу"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm group">
            <div className="aspect-[3/1] bg-muted relative">
              <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
              {!banner.active && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">Өшірулі</span>
                </div>
              )}
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter">
                  {pageLabels[banner.page || "home"]}
                </span>
                {banner.link && (
                  <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{banner.link}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleToggle(banner.id, !banner.active)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    banner.active ? "text-emerald-500 hover:bg-emerald-50" : "text-muted-foreground hover:bg-muted"
                  }`}
                  title={banner.active ? "Жасыру" : "Көрсету"}
                >
                  {banner.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleEdit(banner)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                  title="Өзгерту"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Жою"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
             <Image className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
             <p className="text-muted-foreground text-sm font-medium">Баннерлер әлі қосылмаған</p>
          </div>
        )}
      </div>
    </div>
  );
}
