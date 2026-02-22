import Image from "next/image";

export function HeroBackground({ children }: { children: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden pt-20">
      <Image
        src="/aoe2-bg.png"
        alt=""
        fill
        priority
        className="object-cover object-[center_30%]"
        quality={75}
      />
      <div className="from-background/80 via-background/60 to-background absolute inset-0 bg-gradient-to-b via-50%" />
      <div className="from-background absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent" />

      {children}
    </header>
  );
}
