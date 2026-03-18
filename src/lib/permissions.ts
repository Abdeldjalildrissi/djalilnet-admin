export const PERMISSIONS = {
  articles: {
    create: ["super_admin", "editor", "author"],
    edit: ["super_admin", "editor", "author"],
    delete: ["super_admin", "editor"],
    publish: ["super_admin", "editor"],
  },
  email: {
    view: ["super_admin", "editor"],
    send: ["super_admin", "editor"],
    delete: ["super_admin"],
  },
  users: {
    manage: ["super_admin"],
  },
  categories: {
    create: ["super_admin", "editor"],
    edit: ["super_admin", "editor"],
    delete: ["super_admin"],
  },
} as const

export type Permission = keyof typeof PERMISSIONS
export type Role = "super_admin" | "editor" | "author" | "viewer"

export function hasPermission(
  role: string,
  resource: Permission,
  action: keyof (typeof PERMISSIONS)[Permission]
): boolean {
  const allowed = PERMISSIONS[resource]?.[action] as readonly string[] | undefined
  return allowed?.includes(role) ?? false
}
