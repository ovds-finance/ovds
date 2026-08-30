/**
 * @ovds/contracts — Navigation oRPC Router Contract
 *
 * Exposes the server-driven menu tree and the admin menu-item CRUD surface.
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  NavQuerySchema,
  NavTreeSchema,
  CreateAdminMenuItemSchema,
  UpdateAdminMenuItemSchema,
  AdminMenuItemSchema,
} from '../schemas/nav';

export const navContract = oc.router({
  /** Return the fully-resolved nav tree for the requesting user */
  tree: oc.input(NavQuerySchema).output(NavTreeSchema),

  /** Admin: list all custom menu items */
  adminItems: oc.router({
    list: oc
      .input(z.object({ isActive: z.boolean().optional() }))
      .output(z.array(AdminMenuItemSchema)),

    create: oc
      .input(CreateAdminMenuItemSchema)
      .output(AdminMenuItemSchema),

    update: oc
      .input(z.object({ id: z.string(), data: UpdateAdminMenuItemSchema }))
      .output(AdminMenuItemSchema),

    remove: oc
      .input(z.object({ id: z.string() }))
      .output(z.object({ success: z.boolean() })),
  }),
});

export type NavContract = typeof navContract;
