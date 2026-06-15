declare module 'lucide-taro' {
  import type { ReactElement } from 'react';

  export interface IconProps {
    size?: number | string;
    strokeWidth?: number;
    color?: string;
    className?: string;
    [key: string]: unknown;
  }

  export type LucideIcon = (props: IconProps) => ReactElement;

  export const ClipboardList: LucideIcon;
  export const Headphones: LucideIcon;
  export const ListTodo: LucideIcon;
  export const MapPin: LucideIcon;
  export const ReceiptText: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Users: LucideIcon;
}
