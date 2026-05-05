import * as SliderPrimitive from "@radix-ui/react-slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import * as React from "react";

type Props = {
  costRange: [number, number];
  onCostChange: (v: [number, number]) => void;
  minChance: number;
  onMinChanceChange: (v: number) => void;
  scholarshipOnly: boolean;
  onScholarshipChange: (v: boolean) => void;
};

const fmtK = (n: number) => `$${Math.round(n / 1000)}k`;

/** Slider lilás consistente — usa Radix direto pra evitar conflito com tokens globais. */
function NSSlider({
  className,
  thumbs = 1,
  ...props
}: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { thumbs?: 1 | 2 }) {
  return (
    <SliderPrimitive.Root
      {...props}
      className={cn(
        "relative flex w-full touch-none select-none items-center h-5",
        className,
      )}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#7C3AED]" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbs }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block h-4 w-4 rounded-full bg-[#A855F7] border-2 border-white/90 shadow-[0_0_12px_rgba(168,85,247,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/40 transition-transform hover:scale-110"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export function CompactFilterBar({
  costRange, onCostChange,
  minChance, onMinChanceChange,
  scholarshipOnly, onScholarshipChange,
}: Props) {
  return (
    <div className="rounded-2xl bg-[#12121F] border border-white/5 p-5 md:p-6 grid gap-6 md:grid-cols-3 md:divide-x md:divide-white/5">
      {/* Custo */}
      <div className="md:pr-6 flex flex-col justify-between gap-3 min-h-[68px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wide text-white/50 font-semibold">Custo (anual)</span>
          <span className="text-sm font-bold text-white tabular-nums">
            {fmtK(costRange[0])} – {fmtK(costRange[1])}
          </span>
        </div>
        <NSSlider
          thumbs={2}
          min={0}
          max={150000}
          step={1000}
          minStepsBetweenThumbs={1}
          value={costRange}
          onValueChange={(v) => onCostChange([v[0], v[1]] as [number, number])}
        />
      </div>

      {/* Chance */}
      <div className="md:px-6 flex flex-col justify-between gap-3 min-h-[68px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wide text-white/50 font-semibold">Chance mínima</span>
          <span className="text-sm font-bold text-white tabular-nums">{minChance}%</span>
        </div>
        <NSSlider
          thumbs={1}
          min={0}
          max={100}
          step={5}
          value={[minChance]}
          onValueChange={(v) => onMinChanceChange(v[0])}
        />
      </div>

      {/* Bolsa */}
      <div className="md:pl-6 flex items-center justify-between gap-3 min-h-[68px]">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/50 font-semibold">Bolsa</div>
          <div className="text-sm font-bold text-white mt-1">Só com bolsa</div>
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
