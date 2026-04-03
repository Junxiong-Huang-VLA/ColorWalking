import roleConfigJson from "../config/role-config.json";
import type { RoleConfig } from "../types/role";
import { validateRoleConfig } from "./configValidator";

const ROLE_CONFIG: RoleConfig = validateRoleConfig(roleConfigJson);

export function getRoleConfig(): RoleConfig {
  return ROLE_CONFIG;
}
