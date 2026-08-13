import { StatusTone, STATUS_TONE_CLASSES } from "@/constants/statuses";

interface BadgeProps {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  tone = "neutral",
  children,
  className = "",
}: BadgeProps) {

  return (

    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        ${STATUS_TONE_CLASSES[tone].badgeClass}
        ${className}
      `}
    >
      {children}
    </span>

  );
}
