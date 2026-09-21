import { BiometricType } from '@ovds/shared/types';
export declare class RegisterBiometricDto {
    employeeId: string;
    type: BiometricType;
    template: string;
}
export declare class VerifyBiometricDto {
    employeeId: string;
    type: BiometricType;
    template: string;
}
//# sourceMappingURL=biometrics.dto.d.ts.map