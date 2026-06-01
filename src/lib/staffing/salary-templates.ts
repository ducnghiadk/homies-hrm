import { SalaryConfig } from './types';

// Default Positions
const POS_BARISTA = { id: 'pos-001', name: 'Pha chế chính' };
const POS_CASHIER = { id: 'pos-002', name: 'Thu ngân' };
const POS_HELPER = { id: 'pos-003', name: 'Phụ việc/Đóng gói' };
const POS_MANAGER = { id: 'pos-004', name: 'Quản lý ca' };

export function getHCMSalaryDefaults(): SalaryConfig[] {
  return [
    { positionId: POS_BARISTA.id, positionName: POS_BARISTA.name, type: 'fullTime', amount: 7500000 },
    { positionId: POS_BARISTA.id, positionName: POS_BARISTA.name, type: 'partTime', amount: 28000 },
    
    { positionId: POS_CASHIER.id, positionName: POS_CASHIER.name, type: 'fullTime', amount: 6500000 },
    { positionId: POS_CASHIER.id, positionName: POS_CASHIER.name, type: 'partTime', amount: 25000 },
    
    { positionId: POS_HELPER.id, positionName: POS_HELPER.name, type: 'fullTime', amount: 5500000 },
    { positionId: POS_HELPER.id, positionName: POS_HELPER.name, type: 'partTime', amount: 22000 },
    
    { positionId: POS_MANAGER.id, positionName: POS_MANAGER.name, type: 'fullTime', amount: 9000000 },
  ];
}

export function getHanoiSalaryDefaults(): SalaryConfig[] {
  return [
    { positionId: POS_BARISTA.id, positionName: POS_BARISTA.name, type: 'fullTime', amount: 7000000 },
    { positionId: POS_BARISTA.id, positionName: POS_BARISTA.name, type: 'partTime', amount: 25000 },
    
    { positionId: POS_CASHIER.id, positionName: POS_CASHIER.name, type: 'fullTime', amount: 6000000 },
    { positionId: POS_CASHIER.id, positionName: POS_CASHIER.name, type: 'partTime', amount: 23000 },
    
    { positionId: POS_HELPER.id, positionName: POS_HELPER.name, type: 'fullTime', amount: 5000000 },
    { positionId: POS_HELPER.id, positionName: POS_HELPER.name, type: 'partTime', amount: 20000 },
    
    { positionId: POS_MANAGER.id, positionName: POS_MANAGER.name, type: 'fullTime', amount: 8500000 },
  ];
}
