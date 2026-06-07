'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductBannerSlide {
  key: 'newArrivals' | 'shoppingHelp';
  image: string;
  imagePosition: string;
  href: string;
}

const slides: ProductBannerSlide[] = [
  {
    key: 'newArrivals',
    image: '/hitbot/banners/store-new-arrivals.png',
    imagePosition: 'center',
    href: '/products?stock=preorder',
  },
  {
    key: 'shoppingHelp',
    image: '/hitbot/banners/store-shopping-help.jpg',
    imagePosition: 'center',
    href: '/checkout',
  },
];

export function ProductBannerCarousel() {
  const t = useTranslations('Products.banner');
  const locale = useLocale();
  const [active, setActive] = useState(0);
  const localizedSlides = useMemo(
    () =>
      slides.map((slide) => ({
        ...slide,
        href: `/${locale}${slide.href}`,
        eyebrow: t(`${slide.key}.eyebrow`),
        title: t(`${slide.key}.title`),
        body: t(`${slide.key}.body`),
        cta: t(`${slide.key}.cta`),
        alt: t(`${slide.key}.alt`),
      })),
    [locale, t],
  );

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  function showPrevious() {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNext() {
    setActive((current) => (current + 1) % slides.length);
  }

  return (
    <section
      aria-label={t('label')}
      className="border-divider bg-text-strong relative mb-[16px] h-[148px] overflow-hidden rounded-lg border md:mb-[24px] md:h-[184px] lg:h-[200px]"
    >
      {localizedSlides.map((slide, index) => {
        const isActive = index === active;
        return (
          <div
            key={slide.key}
            className={`absolute inset-0 transition-opacity duration-500 ${
              isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isActive}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="(min-width: 1280px) 1440px, 90vw"
              className="object-cover"
              style={{ objectPosition: slide.imagePosition }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,14,17,0.88),rgba(10,14,17,0.52)_48%,rgba(10,14,17,0.16))]" />
            <div className="relative flex h-full max-w-[660px] flex-col justify-center px-[20px] py-[16px] md:px-[32px] md:py-[20px]">
              <p className="mb-[6px] text-xs font-semibold text-white/68 uppercase md:mb-[8px]">
                {slide.eyebrow}
              </p>
              <h2 className="max-w-[520px] text-xl leading-tight font-semibold text-white md:text-3xl">
                {slide.title}
              </h2>
              <p className="mt-[8px] hidden max-w-[560px] text-sm leading-relaxed text-white/76 sm:block md:text-base">
                {slide.body}
              </p>
              <Link
                href={slide.href}
                tabIndex={isActive ? 0 : -1}
                className="mt-[12px] inline-flex min-h-[40px] w-fit items-center rounded-md bg-white px-[16px] text-sm font-semibold text-[#111918] transition-colors hover:bg-white/88 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none sm:mt-[16px]"
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        );
      })}

      <div className="absolute right-[12px] bottom-[12px] flex items-center gap-[6px] md:right-[16px] md:bottom-[16px] md:gap-[8px]">
        <Button
          type="button"
          variant="icon"
          size="icon"
          className="size-[36px] border-white/20 bg-black/28 text-white hover:bg-black/42"
          onClick={showPrevious}
          aria-label={t('previous')}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-[4px]">
          {localizedSlides.map((slide, index) => (
            <button
              key={slide.key}
              type="button"
              className="flex size-[36px] items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none hover:[&_span]:bg-white/70"
              onClick={() => setActive(index)}
              aria-label={t('goTo', { index: index + 1 })}
              aria-current={index === active}
            >
              <span
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? 'w-5 bg-white' : 'w-1.5 bg-white/46'
                }`}
              />
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="icon"
          size="icon"
          className="size-[36px] border-white/20 bg-black/28 text-white hover:bg-black/42"
          onClick={showNext}
          aria-label={t('next')}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}
