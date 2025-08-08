// Type declarations for better-auth
declare module "better-auth/dist/plugins/admin/index" {
  export interface SessionWithImpersonatedBy {
    impersonatedBy?: string | null
  }
  
  export interface UserWithRole {
    role: string
  }
}
