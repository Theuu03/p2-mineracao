INSERT INTO user_roles (user_id, role)
SELECT id, 'TEACHER'
FROM users
WHERE lower(email) = lower(:'target_email')
  AND status = 'ACTIVE'
  AND email_verified = TRUE
ON CONFLICT (user_id, role) DO NOTHING;
