import { cn } from '@/lib/utils';

type StoreContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * 宽屏档：把最大宽度从 1280 (`max-w-7xl`) 升到 1600，适配宽屏显示器。
   * 1600 取自 footer 容器规范（docs/design/header-footer-spec.md:181），
   * 之前商品页/试用页就用这个宽度。
   */
  wide?: boolean;
};

/**
 * 商城内页主内容容器。
 *
 * 规范基线：商城内页主内容宽度统一为 `max-w-7xl`（1280px），水平内边距 `w-[90%]`
 * （即两侧各留 5% 边距）。来源：docs/design/header-footer-spec.md:181 +
 * docs/design/store-design-system.html:265。
 *
 * 顶部/底部 padding 由各页面通过 `className` 自带；本组件只负责宽度约束。
 *
 * 启用 `wide` 后升到 1600，用于多列 grid 内容（商品列表/详情）或宽屏场景。
 */
export function StoreContainer({
  children,
  className,
  wide = false,
  ...rest
}: StoreContainerProps) {
  return (
    <div
      className={cn('mx-auto w-[90%]', wide ? 'max-w-[1600px]' : 'max-w-7xl', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
