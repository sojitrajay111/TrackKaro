type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-[clamp(1.65rem,3.2vw,2.125rem)] font-extrabold leading-tight tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-[15px] leading-relaxed text-foreground-sub">{description}</p>
      ) : null}
    </div>
  );
}
