import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-[10px]" priority />
      <span className="text-[17px] font-extrabold tracking-tight text-foreground">
        Track<span className="text-primary">Karo</span>
      </span>
    </Link>
  );
}
