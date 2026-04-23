import logo from "@/assets/logo.png";

export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="NEXT SCHOOL" width={size} height={size} className="object-contain" />
      {withText && (
        <span className="font-bold tracking-tight text-foreground">
          NEXT <span className="text-primary">SCHOOL</span>
        </span>
      )}
    </div>
  );
}
