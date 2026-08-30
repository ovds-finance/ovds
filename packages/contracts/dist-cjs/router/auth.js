/**
 * @ovds/contracts — Auth oRPC Router Contract
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "authContract", {
    enumerable: true,
    get: function() {
        return authContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _auth = require("../schemas/auth");
const authContract = _contract.oc.router({
    login: _contract.oc.input(_auth.LoginSchema).output(_auth.AuthTokenSchema),
    refresh: _contract.oc.input(_zod.z.object({})).output(_zod.z.object({
        access_token: _zod.z.string()
    })),
    me: _contract.oc.input(_zod.z.object({})).output(_auth.UserSchema),
    logout: _contract.oc.input(_zod.z.object({})).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    changePassword: _contract.oc.input(_zod.z.object({
        oldPassword: _zod.z.string().min(1),
        newPassword: _zod.z.string().min(8)
    })).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    listUserAppAccess: _contract.oc.input(_zod.z.object({
        userId: _zod.z.string()
    })).output(_zod.z.array(_auth.UserAppAccessSchema)),
    setUserAppAccess: _contract.oc.input(_zod.z.object({
        userId: _zod.z.string(),
        appId: _zod.z.string(),
        accessLevel: _auth.AppAccessLevelSchema
    })).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    removeUserAppAccess: _contract.oc.input(_zod.z.object({
        userId: _zod.z.string(),
        appId: _zod.z.string()
    })).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    listRoleAppAccess: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_auth.RoleAppAccessSchema)),
    setRoleAppAccess: _contract.oc.input(_zod.z.object({
        role: _zod.z.string(),
        appId: _zod.z.string(),
        accessLevel: _auth.AppAccessLevelSchema
    })).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    removeRoleAppAccess: _contract.oc.input(_zod.z.object({
        role: _zod.z.string(),
        appId: _zod.z.string()
    })).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    listApps: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_zod.z.object({
        id: _zod.z.string(),
        name: _zod.z.string(),
        slug: _zod.z.string(),
        description: _zod.z.string().nullable().optional(),
        category: _zod.z.string(),
        isActive: _zod.z.boolean(),
        isFree: _zod.z.boolean()
    })))
});
