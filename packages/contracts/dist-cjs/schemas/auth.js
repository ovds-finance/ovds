/**
 * @ovds/contracts — Auth Schemas
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get AppAccessLevelSchema () {
        return AppAccessLevelSchema;
    },
    get AuthTokenSchema () {
        return AuthTokenSchema;
    },
    get LoginSchema () {
        return LoginSchema;
    },
    get RoleAppAccessSchema () {
        return RoleAppAccessSchema;
    },
    get RolePresetSchema () {
        return RolePresetSchema;
    },
    get RoleSchema () {
        return RoleSchema;
    },
    get UserAppAccessSchema () {
        return UserAppAccessSchema;
    },
    get UserSchema () {
        return UserSchema;
    }
});
const _zod = require("zod");
const RoleSchema = _zod.z.enum([
    'SPURADMIN',
    'SUPERADMIN',
    'ADMIN',
    'HR',
    'ovds',
    'ACCOUNTING',
    'AUDITOR',
    'EMPLOYEE',
    'CRM',
    'IFRS_OFFICER',
    'BANK_LIAISON',
    'EXTERNAL_AUDITOR',
    'DEVELOPER',
    'CLIENT',
    'PROJECT_MANAGER',
    'PARTNER'
]);
const LoginSchema = _zod.z.object({
    username: _zod.z.string().min(1),
    password: _zod.z.string().min(1)
});
const AuthTokenSchema = _zod.z.object({
    access_token: _zod.z.string(),
    user: _zod.z.object({
        id: _zod.z.string(),
        username: _zod.z.string(),
        email: _zod.z.string().nullable().optional(),
        role: RoleSchema,
        companyId: _zod.z.string().nullable().optional(),
        isAuth0User: _zod.z.boolean().optional()
    })
});
const UserSchema = _zod.z.object({
    id: _zod.z.string(),
    username: _zod.z.string(),
    email: _zod.z.string().email().nullable().optional(),
    role: RoleSchema,
    companyId: _zod.z.string().nullable().optional(),
    employeeId: _zod.z.string().nullable().optional(),
    isActive: _zod.z.boolean().default(true),
    mfaEnrolled: _zod.z.boolean().default(false),
    lastLoginAt: _zod.z.coerce.date().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    appAccess: _zod.z.array(_zod.z.object({
        appId: _zod.z.string(),
        appSlug: _zod.z.string().optional(),
        appName: _zod.z.string().optional(),
        accessLevel: _zod.z.enum([
            'none',
            'read',
            'write',
            'admin'
        ]).default('none')
    })).optional().default([])
});
const AppAccessLevelSchema = _zod.z.enum([
    'none',
    'read',
    'write',
    'admin'
]);
const UserAppAccessSchema = _zod.z.object({
    appId: _zod.z.string(),
    accessLevel: AppAccessLevelSchema
});
const RoleAppAccessSchema = _zod.z.object({
    role: _zod.z.string(),
    appId: _zod.z.string(),
    accessLevel: AppAccessLevelSchema
});
const RolePresetSchema = _zod.z.object({
    key: _zod.z.string(),
    label: _zod.z.string(),
    description: _zod.z.string(),
    baseRole: RoleSchema,
    extraPermissions: _zod.z.array(_zod.z.string()),
    appAccess: _zod.z.record(_zod.z.string(), AppAccessLevelSchema)
});
