import logo from "@/assets/logo.png";

export function Logo({ size = 32, withText = true, variant = "auto" }: { size?: number; withText?: boolean; variant?: "auto" | "light" | "dark" }) {
  const textColor = variant === "light" ? "text-white" : "text-foreground";
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logo}
        alt="NEXT SCHOOL"
        width={size}
        height={size}
        className="object-contain drop-shadow-[0_2px_8px_rgba(168,85,247,0.25)]"
      />
      {withText && (
        <span className={`font-display font-bold tracking-tight text-[15px] leading-none ${textColor}`}>
          NEXT <span className="text-gradient-brand">SCHOOL</span>
        </span>
      )}
    </div>
  );
}
