/**
 * @ovds/contracts — Navigation oRPC Router Contract
 *
 * Exposes the server-driven menu tree and the admin menu-item CRUD surface.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "navContract", {
    enumerable: true,
    get: function() {
        return navContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _nav = require("../schemas/nav");
const navContract = _contract.oc.router({
    /** Return the fully-resolved nav tree for the requesting user */ tree: _contract.oc.input(_nav.NavQuerySchema).output(_nav.NavTreeSchema),
    /** Admin: list all custom menu items */ adminItems: _contract.oc.router({
        list: _contract.oc.input(_zod.z.object({
            isActive: _zod.z.boolean().optional()
        })).output(_zod.z.array(_nav.AdminMenuItemSchema)),
        create: _contract.oc.input(_nav.CreateAdminMenuItemSchema).output(_nav.AdminMenuItemSchema),
        update: _contract.oc.input(_zod.z.object({
            id: _zod.z.string(),
            data: _nav.UpdateAdminMenuItemSchema
        })).output(_nav.AdminMenuItemSchema),
        remove: _contract.oc.input(_zod.z.object({
            id: _zod.z.string()
        })).output(_zod.z.object({
            success: _zod.z.boolean()
        }))
    })
});
