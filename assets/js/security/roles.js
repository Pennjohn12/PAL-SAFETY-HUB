export function cleanAccessText(value) {
  return String(value || "").trim().toLowerCase();
}

export function accessGrantIdForEmail(email) {
  return cleanAccessText(email).replace(/\//g, "_");
}

export function rolePayloadForAccess(access) {
  const key = cleanAccessText(access);
  const rolePayloads = {
    employee: { role: "employee", accessLevel: "employee", admin: false, isAdmin: false, disabled: false },
    foreman: { role: "foreman", accessLevel: "foreman", admin: false, isAdmin: false, disabled: false },
    supervisor: { role: "supervisor", accessLevel: "supervisor", admin: false, isAdmin: false, disabled: false },
    office: { role: "office", accessLevel: "office", admin: false, isAdmin: false, disabled: false },
    admin: { role: "admin", accessLevel: "admin", admin: true, isAdmin: true, disabled: false },
    disabled: { role: "disabled", accessLevel: "disabled", admin: false, isAdmin: false, disabled: true }
  };
  return rolePayloads[key] || rolePayloads.foreman;
}

export function profileIsOfficeRole(profile = {}, knownAdmin = false) {
  const role = cleanAccessText(profile?.role);
  const accessLevel = cleanAccessText(profile?.accessLevel);
  return ["office", "admin", "administrator", "owner", "project manager", "project_manager"].includes(role)
    || ["office", "admin", "owner"].includes(accessLevel)
    || profile?.admin === true
    || profile?.isAdmin === true
    || knownAdmin === true;
}

export function profileIsAdminRole(profile = {}, knownAdmin = false) {
  const role = cleanAccessText(profile?.role);
  const accessLevel = cleanAccessText(profile?.accessLevel);
  return ["admin", "administrator", "owner"].includes(role)
    || ["admin", "owner"].includes(accessLevel)
    || profile?.admin === true
    || profile?.isAdmin === true
    || knownAdmin === true;
}

export function profileIsDisabledRole(profile = {}) {
  return profile?.disabled === true
    || cleanAccessText(profile?.role) === "disabled"
    || cleanAccessText(profile?.accessLevel) === "disabled";
}

export function profileIsEmployeeOnlyRole(profile = {}, officeAccess = false, adminAccess = false) {
  const role = cleanAccessText(profile?.role);
  const accessLevel = cleanAccessText(profile?.accessLevel);
  return !officeAccess
    && !adminAccess
    && (role === "employee" || accessLevel === "employee" || role === "intake" || accessLevel === "intake");
}

export function accessRoleLabel(profile = {}, knownAdmin = false) {
  if (profileIsDisabledRole(profile)) return "Disabled";
  if (profileIsAdminRole(profile, knownAdmin)) return "Admin";
  const role = cleanAccessText(profile.role || profile.accessLevel);
  if (["office", "project manager", "project_manager"].includes(role) || cleanAccessText(profile.accessLevel) === "office") return "Office";
  if (["supervisor"].includes(role) || cleanAccessText(profile.accessLevel) === "supervisor") return "Supervisor";
  if (["employee", "intake", "intake-only", "intake_only"].includes(role) || cleanAccessText(profile.accessLevel) === "employee") return "Employee / Intake Only";
  return "Foreman";
}

export function accessRoleValue(profile = {}, knownAdmin = false) {
  const label = accessRoleLabel(profile, knownAdmin);
  if (label === "Admin") return "admin";
  if (label === "Office") return "office";
  if (label === "Supervisor") return "supervisor";
  if (label === "Disabled") return "disabled";
  if (label === "Employee / Intake Only") return "employee";
  return "foreman";
}

export function accessRoleClass(profile = {}, knownAdmin = false) {
  const value = accessRoleValue(profile, knownAdmin);
  if (value === "admin") return "admin";
  if (value === "office") return "office";
  if (value === "disabled") return "disabled";
  if (value === "employee") return "disabled";
  return "field";
}
