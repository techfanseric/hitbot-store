import { defaultProfile } from './orders';
import type { AddressProfile, InvoiceProfile } from './types';

export const addressProfiles: AddressProfile[] = [
  {
    id: 'addr-hq',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    label: '客户总部',
    recipient: defaultProfile.contactName,
    phone: defaultProfile.phone,
    province: '广东省',
    city: '深圳市',
    address: '南山区科技园客户总部 A 栋 8 楼',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'addr-line',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    label: '产线收货点',
    recipient: '顾明澈',
    phone: '17701551867',
    province: '广东省',
    city: '深圳市',
    address: '宝安区智能制造园 2 号产线仓',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];

export const invoiceProfiles: InvoiceProfile[] = [
  {
    id: 'inv-customer',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    label: '客户公司抬头',
    title: defaultProfile.companyName,
    taxId: '91440300CUSTOMER01',
    bankAccount: '招商银行深圳分行 6222 **** **** 001',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];
