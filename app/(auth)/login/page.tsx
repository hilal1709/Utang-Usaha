import type { Metadata } from "next";
import { BrandLockup } from "@/components/brand/logo";
import { BackgroundGradientAnimation } from "@/components/aceternity/background-gradient-animation";
import { StrataHero } from "./strata-hero";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main data-theme="dash" className="ground-fields grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <BackgroundGradientAnimation
          containerClassName="absolute inset-0 h-full w-full"
          gradientBackgroundStart="rgb(29, 84, 108)"
          gradientBackgroundEnd="rgb(45, 114, 143)"
          firstColor="59, 142, 165"
          secondColor="245, 238, 158"
          thirdColor="244, 158, 76"
          fourthColor="171, 52, 40"
          fifthColor="59, 142, 165"
          pointerColor="245, 238, 158"
          size="70%"
          blendingValue="soft-light"
          interactive={false}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <BrandLockup variant="onDark" sub="Unit AR/AP Management & Liquidity" />
          <div className="max-w-[34rem]">
            <StrataHero />
            <h1 className="mt-10 text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
              Aging utang usaha Group, satu definisi dari unggah sampai PPT.
            </h1>
            <p className="mt-4 max-w-[30rem] text-[1.02rem] leading-relaxed text-white/80">
              OpCo mengunggah template bulanan, sistem memeriksa dan menstandarkan, Treasury langsung melihat posisi konsolidasi.
            </p>
          </div>
          <p className="text-xs text-white/60">Penggunaan internal. Data bersifat rahasia.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[25rem]">
          <div className="mb-8 lg:hidden">
            <BrandLockup variant="onDark" sub="Unit AR/AP Management & Liquidity" />
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
