# Crownbridge Global Logistics — free deployment starter

This is a deployable website starter with a customer tracking page and a private shipment administration area. It uses Supabase for the persistent database/authentication and can be hosted on Cloudflare Pages' free tier.

## Company details currently displayed
- Crownbridge Global Logistics
- Owner: Mr. Cristinel Rusu
- Address: 78 Central Avenue, Hounslow, TW3 2QL, England
- Email: crownbridgegloballogistics@gmail.com

**Important:** This project does not verify that the business is registered, licensed, insured, or authorised to provide any particular service. Confirm those claims and the address before publishing. Do not advertise services you do not actually provide. The site is a software starter, not proof of a live courier network.

## What works after setup
- Responsive public company website and pages
- Tracking lookup backed by the Supabase database
- Private admin login
- Create shipment records and generate a tracking reference
- Add timestamped tracking events and update shipment status
- Public tracking results do not reveal customer names

## Free setup checklist

### 1. Create the database
1. Create a free Supabase account at https://supabase.com/ and create a new project.
2. Open the project's **SQL Editor**.
3. Paste and run the full contents of `supabase/schema.sql`.
4. In **Project Settings → API**, copy the Project URL and the publishable/anon key. Never put a `service_role` or secret key in this website.

### 2. Create the owner login
1. In Supabase **Authentication → Users**, add an owner user with an email address you control and a strong unique password.
2. In Supabase **SQL Editor**, run the following after replacing the email with the exact owner login email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'YOUR-OWNER-LOGIN-EMAIL';
```

3. Sign in to the site using that account. Do not make public sign-up available. Only assign the `admin` role to trusted administrators.

### 3. Run locally or deploy free
1. Install Node.js 20 or newer on your computer.
2. Unzip the project and open its folder in a terminal.
3. Install packages with `npm install`.
4. Copy `.env.example` to `.env` and fill in your Supabase Project URL and publishable/anon key.
5. Test with `npm run dev`; create a test shipment and look it up on the tracking page.
6. For free hosting, create a GitHub repository and upload the project files. In Cloudflare Pages, connect that repository and use:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values from Supabase.
7. Deploy. Cloudflare Pages will provide a public `pages.dev` address. A custom domain is optional and usually costs money to register.

## Important before going live
- Add only real shipments and real status updates. Do not use invented tracking scans or demo records as if they were genuine.
- Confirm the company's legal name, registration, address, insurance, customs arrangements, and actual operating capabilities before making public claims.
- Use a strong owner password and enable multi-factor authentication in Supabase if available.
- The tracking page exposes route/status/timestamps for anyone who knows a tracking number. Do not put sensitive personal information in tracking notes.
- Back up your Supabase data. Free-tier limits and policies can change; check the providers' current terms.
- This project does not buy a domain, create a legal company registration, arrange shipping carriers, or create real-world parcel scans. The company owner must arrange those independently.

## Tracking code format
New references use `CBG-YYYYMMDD-###`. The short random suffix is convenient for a small starter system; for production-scale operations, use a database-backed sequence or collision-retry logic before relying on it at volume.
