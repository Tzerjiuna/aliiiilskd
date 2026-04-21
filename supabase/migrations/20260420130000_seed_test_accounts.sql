-- Seed test accounts: 2 admins + 3 regular users
-- Trigger on_auth_user_created will auto-create user_profiles rows

DO $$
DECLARE
    admin1_uuid UUID := gen_random_uuid();
    admin2_uuid UUID := gen_random_uuid();
    user1_uuid  UUID := gen_random_uuid();
    user2_uuid  UUID := gen_random_uuid();
    user3_uuid  UUID := gen_random_uuid();
BEGIN
    -- Insert into auth.users (trigger creates user_profiles automatically)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        -- Admin 1
        (admin1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin1@islamicboo.com', crypt('Admin@123456', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Ahmad Faris', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        -- Admin 2
        (admin2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin2@islamicboo.com', crypt('Admin@123456', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Siti Rahimah', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        -- Regular User 1
        (user1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'user1@islamicboo.com', crypt('User@123456', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Muhammad Hafiz'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        -- Regular User 2
        (user2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'user2@islamicboo.com', crypt('User@123456', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Nurul Izzah'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        -- Regular User 3
        (user3_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'user3@islamicboo.com', crypt('User@123456', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Khairul Anwar'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Update role to 'admin' for admin accounts in user_profiles
    -- (trigger sets role from raw_user_meta_data, but we ensure it here too)
    UPDATE public.user_profiles
    SET role = 'admin'::public.user_role
    WHERE id IN (admin1_uuid, admin2_uuid);

    -- Set some wallet balance for regular users for testing
    UPDATE public.user_profiles
    SET wallet_balance = 500.00
    WHERE id IN (user1_uuid, user2_uuid, user3_uuid);

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Seed failed: %', SQLERRM;
END $$;
