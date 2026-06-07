import Image from 'next/image';

// TODO: заменить заглушку на реальную ссылку рекламодателя
const BANNER_URL = '#';

const DISCLAIMER =
  'Реклама 18+. Рекламодатель ООО «БК ПАРИ», ИНН 7703365167 erid: 2vtzqw4vpvC';

export default function PromoBanner() {
  return (
    <section className="px-4 sm:px-6 lg:px-12 pt-4 lg:pt-6">
      <a
        href={BANNER_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label="Реклама БК ПАРИ"
        className="group relative block w-full overflow-hidden rounded-2xl lg:rounded-[28px] bg-teal-500"
      >
        {/* основной ряд: 3 равные зоны → кешбэк всегда по центру баннера */}
        <div className="relative flex items-center justify-between gap-2 sm:gap-5 lg:gap-8 h-32 sm:h-36 lg:h-40 px-4 sm:px-8 lg:px-[50px]">
          {/* ── ЛЕВО: PARI ── */}
          <div className="flex items-center shrink-0 w-20 sm:w-32 lg:w-52">
            <div className="relative h-7 w-full sm:h-9 lg:h-14">
              <Image
                src="/parin.png"
                alt="PARI"
                fill
                sizes="(max-width: 640px) 80px, (max-width: 1024px) 130px, 210px"
                className="object-contain object-left"
              />
            </div>
          </div>

          {/* ── ЦЕНТР: кешбэк ── */}
          <div className="flex-1 flex items-center justify-center min-w-0 px-1">
            <div className="relative h-24 w-full max-w-[240px] sm:h-28 sm:max-w-[380px] lg:h-32 lg:max-w-[560px]">
              <Image
                src="/cashb.png"
                alt="Кешбэк до 30% рублями"
                fill
                sizes="(max-width: 640px) 240px, (max-width: 1024px) 380px, 560px"
                className="object-contain"
              />
            </div>
          </div>

          {/* ── ПРАВО: кнопка «Забирай» ── */}
          <div className="flex items-center justify-end shrink-0 w-20 sm:w-32 lg:w-52">
            <div className="relative h-8 w-20 sm:h-10 sm:w-28 lg:h-12 lg:w-44 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/grab.png"
                alt="Забирай"
                fill
                sizes="(max-width: 640px) 80px, (max-width: 1024px) 112px, 176px"
                className="object-contain object-right"
              />
            </div>
          </div>
        </div>

        {/* +18 — верхний левый угол */}
        <span className="absolute top-2 left-4 sm:top-3 sm:left-8 lg:top-[18px] lg:left-[50px] text-black/85 font-medium leading-none text-[14px] sm:text-[16px] lg:text-[20px] select-none">
          +18
        </span>

        {/* юридический дисклеймер — нижний левый угол */}
        <p className="absolute bottom-2 left-4 sm:bottom-2.5 sm:left-8 lg:bottom-[16px] lg:left-[50px] max-w-[58%] sm:max-w-[300px] lg:max-w-[380px] text-black/55 leading-tight text-[7px] sm:text-[8px] lg:text-[9px]">
          {DISCLAIMER}
        </p>
      </a>
    </section>
  );
}