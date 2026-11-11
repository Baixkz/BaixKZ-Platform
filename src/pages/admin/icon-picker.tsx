import { useState } from "react";
import * as Icons from "lucide-react";
import { Search } from "lucide-react";

const POPULAR_ICONS = [
  "Folder", "Car", "Home", "ShoppingBag", "Smartphone", "Laptop", "Shirt",
  "Baby", "Dog", "Cat", "Dumbbell", "Wrench", "Paintbrush", "Music",
  "Camera", "Book", "Briefcase", "GraduationCap", "Heart", "Star",
  "Plane", "Train", "Bike", "Utensils", "Pill", "Stethoscope",
  "Hammer", "Scissors", "Gem", "Watch", "Glasses", "Armchair",
  "Leaf", "Flower", "Sun", "Moon", "Cloud", "Droplet",
  "Gamepad2", "Trophy", "Medal", "Target", "Zap", "Flame",
  "Shield", "Lock", "Key", "Gift", "Package", "Box",
  "MapPin", "Building", "Building2", "Factory", "Store", "Warehouse",
  "Tractor", "Truck", "Bus", "Sailboat",
  "PaintBucket", "Palette", "Ruler", "PenTool",
  "Cpu", "HardDrive", "Monitor", "Printer", "Wifi",
  "Headphones", "Speaker", "Mic", "Video", "Film",
  "Apple", "Cherry", "Citrus", "Beef",
  "Bed", "Bath", "Lamp", "Sofa", "DoorOpen",
  "TreePine", "Mountain", "Waves", "Fish",
];

interface IconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

// ЭКСПОРТТЫ ТЕКСЕР: admin-panel.tsx-те осылай шақырылуы керек
export function IconPicker({ selected, onSelect }: IconPickerProps) {
  const [search, setSearch] = useState("");

  const filteredIcons = search
    ? POPULAR_ICONS.filter((i) => i.toLowerCase().includes(search.toLowerCase()))
    : POPULAR_ICONS;

  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-slate-50 shadow-sm">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Иконка іздеу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-50 focus:border-blue-500 rounded-xl text-[11px] font-bold outline-none transition-all"
        />
      </div>
      
      {/* no-scrollbar класы CSS-те жазылмаған болса, оны алып тастауға болады */}
      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
        {filteredIcons.map((iconName) => {
          // Lucide иконкаларын динамикалық түрде алу
          const Icon = (Icons as any)[iconName];
          
          // Егер иконка табылмаса, бос орын қалдырмау
          if (!Icon || typeof Icon !== 'function') return null;
          
          const isActive = selected === iconName;
          
          return (
            <button
              key={iconName}
              type="button" // Форма ішінде болса, бетті жаңартып жібермеуі үшін керек
              onClick={() => onSelect(iconName)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              }`}
              title={iconName}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
      
      {filteredIcons.length === 0 && (
        <div className="text-center py-6">
          <p className="text-[10px] font-black text-slate-300 uppercase">Ештеңе табылмады</p>
        </div>
      )}
    </div>
  );
}
