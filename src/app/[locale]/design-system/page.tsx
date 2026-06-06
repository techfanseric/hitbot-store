import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

const BRAND_SWATCHES = [
  { name: 'brand-500', className: 'bg-brand-500' },
  { name: 'brand-600', className: 'bg-brand-600' },
  { name: 'brand-400', className: 'bg-brand-400' },
  { name: 'brand-100', className: 'bg-brand-100' },
  { name: 'brand-50', className: 'bg-brand-50' },
] as const;

const NEUTRAL_SWATCHES = [
  { name: 'neutral-0', className: 'bg-neutral-0' },
  { name: 'neutral-100', className: 'bg-neutral-100' },
  { name: 'neutral-200', className: 'bg-neutral-200' },
  { name: 'neutral-500', className: 'bg-neutral-500' },
  { name: 'neutral-900', className: 'bg-neutral-900' },
  { name: 'neutral-1000', className: 'bg-neutral-1000' },
] as const;

const STATE_SWATCHES = [
  { name: 'state-green', className: 'bg-state-green' },
  { name: 'state-yellow', className: 'bg-state-yellow' },
  { name: 'state-blue', className: 'bg-state-blue' },
  { name: 'state-danger', className: 'bg-state-danger' },
] as const;

const RADIUS_TOKENS = [
  { name: 'xs', className: 'rounded-xs' },
  { name: 'sm', className: 'rounded-sm' },
  { name: 'md', className: 'rounded-md' },
  { name: 'lg', className: 'rounded-lg' },
  { name: 'xl', className: 'rounded-xl' },
  { name: 'pill', className: 'rounded-pill' },
] as const;

const SHADOW_TOKENS = [
  { name: 'floating', className: 'shadow-floating' },
  { name: 'popover', className: 'shadow-popover' },
  { name: 'floating-strong', className: 'shadow-floating-strong' },
  { name: 'light', className: 'shadow-light' },
] as const;

export default async function DesignSystemPage() {
  const t = await getTranslations('DesignSystem');

  return (
    <div className="mx-auto w-[90%] max-w-[1600px] py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="text-text-muted mt-2">{t('subtitle')}</p>
      </div>

      {/* 颜色 */}
      <Section title="01 颜色" desc="品牌色跨主题不变；中性色和状态色按主题切换">
        <ColorGroup label="品牌色（共享）">
          {BRAND_SWATCHES.map((s) => (
            <Swatch key={s.name} name={s.name} className={s.className} />
          ))}
        </ColorGroup>
        <ColorGroup label="中性色（共享）">
          {NEUTRAL_SWATCHES.map((s) => (
            <Swatch key={s.name} name={s.name} className={s.className} />
          ))}
        </ColorGroup>
        <ColorGroup label="状态色">
          {STATE_SWATCHES.map((s) => (
            <Swatch key={s.name} name={s.name} className={s.className} />
          ))}
        </ColorGroup>
      </Section>

      {/* 字号 */}
      <Section title="02 字号" desc="8 档基础字号">
        <div className="space-y-2">
          <div className="text-xs">--text-xs · 10px · 徽标/角标</div>
          <div className="text-sm">--text-sm · 11px · 次要文字</div>
          <div className="text-md">--text-md · 12px · OS 端基线</div>
          <div className="text-lg">--text-lg · 14px · 段落正文</div>
          <div className="text-xl">--text-xl · 16px · 面板标题</div>
          <div className="text-2xl">--text-2xl · 20px · 区块标题</div>
          <div className="text-3xl">--text-3xl · 24px · 页面标题</div>
          <div className="text-5xl">--text-5xl · 48px · 营销头图</div>
        </div>
      </Section>

      {/* 间距 */}
      <Section title="03 间距" desc="4 的倍数，8 档">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sp) => (
            <div key={sp} className="flex items-center gap-3">
              <span className="text-text-muted w-16 text-sm">--spacing-{sp}</span>
              <div className="bg-brand-500 h-4" style={{ width: `${sp * 4}px` }} />
              <span className="text-text-muted text-sm">{sp * 4}px</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 圆角 */}
      <Section title="04 圆角" desc="6 档圆角 + pill">
        <div className="flex flex-wrap gap-4">
          {RADIUS_TOKENS.map((r) => (
            <div
              key={r.name}
              className={`bg-bg-control flex h-16 w-16 items-center justify-center text-xs ${r.className}`}
            >
              {r.name}
            </div>
          ))}
        </div>
      </Section>

      {/* 阴影 */}
      <Section title="05 阴影" desc="仅用于浮层/弹窗">
        <div className="bg-bg-app flex flex-wrap gap-6 rounded-md p-4">
          {SHADOW_TOKENS.map((s) => (
            <div
              key={s.name}
              className={`bg-bg-elevated flex h-20 w-32 items-center justify-center rounded-md text-sm ${s.className}`}
            >
              {s.name}
            </div>
          ))}
        </div>
      </Section>

      {/* 按钮 */}
      <Section title="06 按钮 4 套" desc="primary / secondary / subtle / icon">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="icon" size="icon" aria-label="settings">
              ⚙
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="md">
              Default
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" shape="square">
              {t('shapeSquare')}
            </Button>
            <Button variant="primary" shape="pill">
              {t('shapePill')}
            </Button>
          </div>
        </div>
      </Section>

      {/* 状态徽标 */}
      <Section title="09 状态徽标" desc="用色块/明度表达状态">
        <div className="flex flex-wrap gap-2">
          <span className="bg-state-green/15 text-state-green-strong inline-flex items-center rounded-md px-2 py-0.5 text-xs">
            现货
          </span>
          <span className="bg-bg-control text-text-muted inline-flex items-center rounded-md px-2 py-0.5 text-xs">
            缺货
          </span>
          <span className="bg-state-red-soft text-state-danger inline-flex items-center rounded-md px-2 py-0.5 text-xs">
            活动中
          </span>
          <span className="bg-state-green/20 text-state-green-strong inline-flex items-center rounded-md px-2 py-0.5 text-xs">
            运行中
          </span>
          <span className="bg-state-yellow/20 text-state-yellow-strong inline-flex items-center rounded-md px-2 py-0.5 text-xs">
            编译中
          </span>
          <span className="bg-bg-control text-text-muted inline-flex items-center rounded-md px-2 py-0.5 text-xs">
            未运行
          </span>
          <span className="bg-brand-soft text-brand-500 inline-flex items-center rounded-md px-2 py-0.5 text-xs">
            标准件
          </span>
          <span className="bg-state-yellow/20 text-state-yellow-strong inline-flex items-center rounded-md px-2 py-0.5 text-xs">
            加工件
          </span>
          <span className="bg-bg-control text-text-muted inline-flex items-center rounded-md px-2 py-0.5 text-xs">
            参考件
          </span>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-bg-elevated mb-6 rounded-lg p-6">
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="text-text-muted mb-4 text-sm">{desc}</p>
      {children}
    </section>
  );
}

function ColorGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-text-muted mb-2 text-sm">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-12 w-12 rounded-md ${className}`} />
      <span className="text-text-muted text-xs">{name}</span>
    </div>
  );
}
