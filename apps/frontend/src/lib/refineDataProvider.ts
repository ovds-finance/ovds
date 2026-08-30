import {
  type DataProvider,
  type BaseRecord,
  type CrudFilter,
  type GetListParams,
  type GetManyParams,
  type GetOneParams,
  type CreateParams,
  type CreateManyParams,
  type UpdateParams,
  type UpdateManyParams,
  type DeleteOneParams,
  type DeleteManyParams,
  type CustomParams,
} from "@refinedev/core";
import api, { extractData, apiGetPaginated, API_BASE } from "../services/api";
import type { AxiosResponse } from "axios";
const RESOURCE_MAP: Record<string, string> = {
  companies: "/ovds/companies",
  invoices: "/sales/invoices",
  bills: "/purchases/bills",
  customers: "/crm/contacts",
  vendors: "/purchases/vendors",
  employees: "/hr/employees",
  accounts: "/accounting/accounts",
  items: "/ovds/inventory/items",
  journals: "/accounting/journals",
  expenseClaims: "/accounting/expense-claims",
  purchaseOrders: "/ovds/purchase-orders",
  fixedAssets: "/accounting/fixed-assets",
  bankAccounts: "/banking/accounts",
  departments: "/hr/departments",
  projects: "/ovds/projects",
  users: "/auth/users",
};

function resolvePath(resource: string): string {
  return RESOURCE_MAP[resource] || `/${resource.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
}

function buildQueryString(
  pagination?: { current?: number; pageSize?: number; mode?: string },
  sorters?: { field: string; order: "asc" | "desc" }[],
  filters?: CrudFilter[],
): string {
  const params = new URLSearchParams();

  const page = pagination?.current ?? 1;
  const pageSize = pagination?.pageSize;

  if (page > 1) {
    params.set("page", String(page));
  }
  // Always send limit so backend doesn't fall back to its own default
  if (pageSize !== undefined) {
    params.set("limit", String(pageSize));
  }

  if (sorters?.length) {
    const s = sorters[0];
    if (s.field) {
      params.set("sortBy", s.field);
      params.set("sortOrder", s.order === "desc" ? "desc" : "asc");
    }
  }

  if (filters?.length) {
    for (const f of filters) {
      if ("field" in f && "value" in f && f.value !== undefined && f.value !== null && f.value !== "") {
        params.set(f.field, String(f.value));
      }
    }
  }

  return params.toString();
}

const refineDataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>({ resource, pagination, sorters, filters }: GetListParams) => {
    const path = resolvePath(resource);
    const qs = buildQueryString(pagination, sorters, filters);
    const url = qs ? `${path}?${qs}` : path;

    const result = await apiGetPaginated<TData>(url);
    return {
      data: result.data,
      total: result.total,
    };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id, meta }: GetOneParams) => {
    const path = resolvePath(resource);
    const response = await api.get(`${path}/${id}`, { ...meta });
    const data = extractData<TData>(response);
    return { data };
  },

  getMany: async <TData extends BaseRecord = BaseRecord>({ resource, ids, meta }: GetManyParams) => {
    const path = resolvePath(resource);
    const promises = ids.map((id: string | number) =>
      api.get(`${path}/${id}`, { ...meta }).then((r: AxiosResponse) => extractData<TData>(r)),
    );
    const data = await Promise.all(promises);
    return { data };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = unknown>({ resource, variables, meta }: CreateParams<TVariables>) => {
    const path = resolvePath(resource);
    const response = await api.post(path, variables, { ...meta });
    const data = extractData<TData>(response);
    return { data };
  },

  createMany: async <TData extends BaseRecord = BaseRecord, TVariables = unknown>({ resource, variables, meta }: CreateManyParams<TVariables>) => {
    const path = resolvePath(resource);
    const promises = variables.map((vars: TVariables) =>
      api.post(path, vars, { ...meta }).then((r: AxiosResponse) => extractData<TData>(r)),
    );
    const data = await Promise.all(promises);
    return { data };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = unknown>({ resource, id, variables, meta }: UpdateParams<TVariables>) => {
    const path = resolvePath(resource);
    const response = await api.patch(`${path}/${id}`, variables, { ...meta });
    const data = extractData<TData>(response);
    return { data };
  },

  updateMany: async <TData extends BaseRecord = BaseRecord, TVariables = unknown>({ resource, ids, variables, meta }: UpdateManyParams<TVariables>) => {
    const path = resolvePath(resource);
    const promises = ids.map((id: string | number) =>
      api.patch(`${path}/${id}`, variables, { ...meta }).then((r: AxiosResponse) => extractData<TData>(r)),
    );
    const data = await Promise.all(promises);
    return { data };
  },

  deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = unknown>({ resource, id, variables, meta }: DeleteOneParams<TVariables>) => {
    const path = resolvePath(resource);
    const response = await api.delete(`${path}/${id}`, { ...meta, data: variables });
    const data = extractData<TData>(response);
    return { data };
  },

  deleteMany: async <TData extends BaseRecord = BaseRecord, TVariables = unknown>({ resource, ids, variables, meta }: DeleteManyParams<TVariables>) => {
    const path = resolvePath(resource);
    const promises = ids.map((id: string | number) =>
      api.delete(`${path}/${id}`, { ...meta, data: variables }).then((r: AxiosResponse) => extractData<TData>(r)),
    );
    const data = await Promise.all(promises);
    return { data };
  },

  getApiUrl: () => API_BASE,

  custom: async <TData extends BaseRecord = BaseRecord, TQuery = unknown, TPayload = unknown>({ url, method, sorters, filters, payload, query, headers, meta }: CustomParams<TQuery, TPayload>) => {
    let fullUrl = url;
    const qs = buildQueryString(undefined, sorters, filters);
    if (qs) {
      fullUrl = `${url}${url.includes("?") ? "&" : "?"}${qs}`;
    }

    const apiBase = API_BASE;
    const resolvedUrl = fullUrl.startsWith("http") ? fullUrl : `${apiBase}${fullUrl}`;

    const response = await api.request({
      url: resolvedUrl,
      method: method as any,
      data: payload,
      params: query,
      headers: { ...headers, ...(meta?.headers as Record<string, string> | undefined) },
    });

    const data = extractData<TData>(response);
    return { data };
  },
};

export { refineDataProvider };
export type { BaseRecord };
