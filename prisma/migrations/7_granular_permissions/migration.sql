-- Permissions become "<action>:<resource>" (view/create/edit/delete on plants, devices, users, roles).
-- Convert every existing role:
--   * everyone could already read plants and devices -> view:plants, view:devices
--   * plants:write   -> create/edit/delete:plants
--   * devices:write  -> create/edit/delete:devices
--   * users:manage   -> view/create/edit/delete on users and roles
UPDATE "roles" SET "permissions" = ARRAY(
  SELECT DISTINCT p FROM unnest(
    ARRAY['view:plants', 'view:devices']
    || CASE WHEN 'plants:write' = ANY(COALESCE("permissions", ARRAY[]::TEXT[]))
         THEN ARRAY['create:plants', 'edit:plants', 'delete:plants'] ELSE ARRAY[]::TEXT[] END
    || CASE WHEN 'devices:write' = ANY(COALESCE("permissions", ARRAY[]::TEXT[]))
         THEN ARRAY['create:devices', 'edit:devices', 'delete:devices'] ELSE ARRAY[]::TEXT[] END
    || CASE WHEN 'users:manage' = ANY(COALESCE("permissions", ARRAY[]::TEXT[]))
         THEN ARRAY['view:users', 'create:users', 'edit:users', 'delete:users',
                    'view:roles', 'create:roles', 'edit:roles', 'delete:roles'] ELSE ARRAY[]::TEXT[] END
  ) AS p ORDER BY p
);
