import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type Props = {
  costRange: [number, number];
  onCostChange: (v: [number, number]) => void;
  minChance: number;
  onMinChanceChange: (v: number) => void;
  scholarshipOnly: boolean;
  onScholarshipChange: (v: boolean) => void;
};

const fmtK = (n: number) => `$${Math.round(n / 1000)}k`;

export function CompactFilterBar({
  costRange, onCostChange,
  minChance, onMinChanceChange,
  scholarshipOnly, onScholarshipChange,
}: Props) {
  return (
    <div className="rounded-2xl bg-[#12121F] border border-white/5 p-5 md:p-6 grid gap-6 md:grid-cols-3 md:divide-x md:divide-white/5">
      {/* Custo */}
      <div className="md:pr-6 space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wide text-white/50 font-semibold">Custo (anual)</span>
          <span className="text-sm font-bold text-white tabular-nums">
            {fmtK(costRange[0])} – {fmtK(costRange[1])}
          </span>
        </div>
        <Slider
          min={0}
          max={150000}
          step={1000}
          value={costRange}
          onValueChange={(v) => onCostChange([v[0], v[1]] as [number, number])}
          className="[&_[data-slot=slider-track]]:bg-white/10 [&_[role=slider]]:border-[#A855F7] [&_[role=slider]]:bg-[#A855F7] [&_[role=slider]]:shadow-[0_0_12px_rgba(168,85,247,0.6)] [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-[#A855F7] [&_.bg-primary]:to-[#7C3AED]"
        />
      </div>

      {/* Chance */}
      <div className="md:px-6 space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wide text-white/50 font-semibold">Chance mínima</span>
          <span className="text-sm font-bold text-white tabular-nums">{minChance}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[minChance]}
          onValueChange={(v) => onMinChanceChange(v[0])}
          className="[&_[data-slot=slider-track]]:bg-white/10 [&_[role=slider]]:border-[#A855F7] [&_[role=slider]]:bg-[#A855F7] [&_[role=slider]]:shadow-[0_0_12px_rgba(168,85,247,0.6)] [&_.bg-primary]:bg-[#A855F7]"
        />
      </div>

      {/* Bolsa */}
      <div className="md:pl-6 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Só com bolsa</div>
          <div className="text-[11px] text-white/50">Filtra apenas universidades que oferecem bolsa</div>
        </div>
        <Switch
          checked={scholarshipOnly}
          onCheckedChange={onScholarshipChange}
          className="data-[state=checked]:bg-[#A855F7] data-[state=unchecked]:bg-white/10"
        />
      </div>
    </div>
  );
}
