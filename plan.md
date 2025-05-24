# AgriValue Connect - Development Plan

**Goal:** Build an MVP for "AgriValue Connect," a platform to reduce post-harvest losses for farmers with perishable goods by connecting them with buyers and facilitating timely sales.

**Core Technologies:** Next.js, Supabase, Tailwind CSS, shadcn/ui
**Package Manager:** pnpm

---

**Phase 1: Project Setup & Initialization**

*   [x] **Git Setup:**
    *   [x] Initialize a new Git repository: `git init`
    *   [x] Create an initial commit with project files.
    *   [x] Create a repository on GitHub (or preferred platform) and push the initial commit.
*   [x] **Initialize Next.js Project:**
    *   [x] Open your terminal.
    *   [x] Run the Next.js create command:
        ```bash
        pnpm create next-app agri-value-connect --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
        ```
    *   [x] `cd agri-value-connect`
*   [x] **Supabase Project Setup:**
    *   [x] Go to [supabase.com](https://supabase.com) and create a new project.
    *   [x] Note down your Project URL and `anon` key (and `service_role` key, securely).
*   [x] **Install Core Dependencies:**
    *   [x] Supabase client & Auth Helpers:
        ```bash
        pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
        ```
    *   [x] UI & Utilities:
        ```bash
        pnpm add date-fns react-hook-form lucide-react
        ```
    *   [x] Mapping (if implementing):
        ```bash
        pnpm add react-leaflet leaflet
        pnpm add -D @types/leaflet
        ```
*   [x] **Initialize `shadcn/ui`:**
    *   [x] Follow the `shadcn/ui` installation guide for Next.js:
        ```bash
        pnpm dlx shadcn-ui@latest init
        ```
    *   [x] Configure `tailwind.config.js` and `globals.css` as per `shadcn/ui` instructions.
*   [x] **Environment Variables:**
    *   [x] Create a `.env.local` file in your project root.
    *   [x] Add your Supabase Project URL and `anon` key.
    *   [x] Ensure `.env.local` is in `.gitignore`.
*   [x] **Supabase Client Helpers:**
    *   [x] Create utility files for initializing Supabase client.
*   **Testing & Verification (Phase 1):**
    *   [x] Verify Next.js app runs locally (`pnpm dev`).
    *   [x] Confirm Supabase connection can be established (e.g., a simple test query).
    *   [x] Check that `shadcn/ui` components can be imported and rendered without errors.
    *   [x] Commit changes: `git add . && git commit -m "Phase 1: Project Setup & Initialization Complete"`

---

**Phase 2: Database Schema Design & Supabase Setup**

*   [x] **Define Database Tables:**
    *   [x] `profiles` table defined.
    *   [x] `products` (Listings) table defined.
    *   [x] `chats` table defined.
    *   [x] `messages` table defined.
*   [x] **Implement Schema in Supabase:**
    *   [x] Tables created in Supabase Table Editor or via SQL.
    *   [x] Relationships, data types, and defaults configured.
*   [x] **Row Level Security (RLS):**
    *   [x] RLS enabled for all tables.
    *   [x] Policies for `profiles` implemented.
    *   [x] Policies for `products` implemented.
    *   [x] Policies for `chats` implemented.
    *   [x] Policies for `messages` implemented.
*   [x] **Supabase Storage:**
    *   [x] Public bucket for product images created. (bucket_id = 'product-images')
    *   [x] Storage policies configured.
*   [x] **Database Functions/Triggers:**
    *   [x] (Recommended) Function to create `profile` on `auth.users` insert implemented and tested.
    *   [ ] (Optional) Trigger for `updated_at` timestamps. (Skipped for MVP)
*   **Testing & Verification (Phase 2):**
    *   [x] Manually add sample data to tables via Supabase Studio.
    *   [x] Test RLS policies by querying data as different test users (using Supabase SQL Editor's role impersonation or client-side tests).
    *   [ ] Verify image uploads to Supabase Storage bucket work as expected. (Deferred to Phase 4)
    *   [x] Confirm the `profile` creation trigger/function works when a new user is added to `auth.users`.
    *   [x] Commit changes: `git add . && git commit -m "Phase 2: Database Schema & Supabase Setup Complete"`

---

**Phase 3: Authentication**

*   [x] **Integrate Supabase Auth:**
    *   [x] Utilize `@supabase/auth-helpers-nextjs` and `@supabase/ssr` for session management.
*   [x] **Auth UI:**
    *   [x] Login form created using `shadcn/ui`.
    *   [x] Signup form created using `shadcn/ui`.
    *   [ ] (Optional) Consider Supabase UI's `Password-Based Auth` block. (Skipped for MVP)
*   [x] **Auth Logic:**
    *   [x] `signUp` function implemented and working.
    *   [x] `signInWithPassword` function implemented and working.
    *   [x] `signOut` function implemented and working.
    *   [x] User sessions handled correctly (persisted, cleared on logout).
    *   [x] Redirects based on auth state implemented.
*   [x] **Protected Routes/Layouts:**
    *   [x] Middleware or layout checks for protecting routes implemented.
*   **Testing & Verification (Phase 3):**
    *   [x] Test user registration: new user can sign up, `auth.users` entry created, `profiles` entry created.
    *   [x] Test user login: existing user can log in.
    *   [x] Test user logout: session is cleared.
    *   [x] Verify protected routes are inaccessible when logged out and accessible when logged in.
    *   [x] Check for appropriate error handling (e.g., incorrect password, user already exists).
    *   [x] Commit changes: `git add . && git commit -m "Phase 3: Authentication Complete"`

---

**Phase 4: Core Features - Product Listings & Browsing**

*   [ ] **Farmer - Create Listing Page (`/products/new`):**
    *   [ ] Form built with `React Hook Form` & `shadcn/ui`.
    *   [ ] Image upload functionality integrated.
    *   [ ] Data successfully saves to `products` table in Supabase.
*   [ ] **Buyer - Browse Listings Page (`/products` or `/`):**
    *   [ ] Active product listings fetched and displayed.
    *   [ ] Basic search by `crop_type` implemented.
    *   [ ] Basic sort functionality implemented.
*   [ ] **Single Product View Page (`/products/[id]`):**
    *   [ ] Detailed product information displayed.
    *   [ ] Farmer details (from `profiles`) displayed.
*   [ ] **Farmer - Manage My Listings Page (`/my-listings`):**
    *   [ ] Logged-in farmer's listings displayed.
    *   [ ] Edit functionality implemented (updates product in Supabase).
    *   [ ] Delete functionality implemented (updates product status or deletes from Supabase).
*   [ ] **Dynamic Discounting Logic:**
    *   [ ] Simple date-based discounting logic implemented and visible.
*   **Testing & Verification (Phase 4):**
    *   [ ] Farmer can create a new listing with all details and an image.
    *   [ ] Buyer can see the new listing on the browse page.
    *   [ ] Search and sort functions work as expected on the browse page.
    *   [ ] Buyer can view the full details of a product.
    *   [ ] Farmer can view, edit, and delete their own listings.
    *   [ ] Dynamic discounting appears correctly for relevant products.
    *   [ ] Commit changes: `git add . && git commit -m "Phase 4: Product Listings & Browsing Complete"`

---

**Phase 5: Chat Functionality**

*   [ ] **"Contact Farmer" / "Make Offer" Button:**
    *   [ ] Button present on product detail page.
    *   [ ] Clicking creates/navigates to a chat instance (entry in `chats` table).
*   [ ] **Chat Interface (`/chat/[chatId]`):**
    *   [ ] Supabase Realtime subscription for messages established.
    *   [ ] Existing messages for the chat displayed.
    *   [ ] Input field allows sending new messages.
    *   [ ] New messages appear in real-time for both users.
    *   [ ] (Optional) Supabase UI `Realtime Chat` block integrated.
*   [ ] **List User's Chats (`/chats`):**
    *   [ ] Page displays a list of chats the current user is part of.
*   **Testing & Verification (Phase 5):**
    *   [ ] Buyer can initiate a chat with a farmer from a product page.
    *   [ ] Both farmer and buyer can send and receive messages in real-time within the chat.
    *   [ ] Chat history is persistent.
    *   [ ] Users can see a list of their active chats.
    *   [ ] Commit changes: `git add . && git commit -m "Phase 5: Chat Functionality Complete"`

---

**Phase 6: Notifications (Simplified In-App)**

*   [ ] **Use Supabase Realtime for Notifications:**
    *   [ ] Visual indicator (e.g., badge) appears for new messages in chats the user is part of but not currently viewing.
*   **Testing & Verification (Phase 6):**
    *   [ ] When User A sends a message to User B (who is on a different page), User B sees a notification indicator.
    *   [ ] Indicator clears or updates appropriately when User B views the chat.
    *   [ ] Commit changes: `git add . && git commit -m "Phase 6: In-App Notifications Complete"`

---

**Phase 7: User Profiles**

*   [ ] **Profile Page (`/profile` or `/profile/[userId]`):**
    *   [ ] Logged-in user can view their own profile information.
    *   [ ] Logged-in user can edit their own profile information (e.g., name, location).
    *   [ ] Users can view basic public information of other users (e.g., from a product listing).
*   **Testing & Verification (Phase 7):**
    *   [ ] User can view their profile details.
    *   [ ] User can update their profile details, and changes are saved.
    *   [ ] Public profile information of other users is displayed correctly and doesn't expose sensitive data.
    *   [ ] Commit changes: `git add . && git commit -m "Phase 7: User Profiles Complete"`

---

**Phase 8: UI Polishing & Styling**

*   [ ] **Consistent Design:**
    *   [ ] Review all pages for consistent use of `shadcn/ui` components and Tailwind CSS.
*   [ ] **Responsiveness:**
    *   [ ] Test and ensure usability on mobile, tablet, and desktop screen sizes.
*   [ ] **UX Review:**
    *   [ ] Click through all user flows, identifying and fixing confusing or awkward interactions.
    *   [ ] Ensure appropriate user feedback for actions.
*   [ ] **Loading & Empty States:**
    *   [ ] Implement loading indicators (spinners, skeletons) for data fetching.
    *   [ ] Implement clear messages for empty states (e.g., "No products found," "You have no messages").
*   **Testing & Verification (Phase 8):**
    *   [ ] Application is visually consistent and aesthetically pleasing.
    *   [ ] All interactive elements are responsive and work across target devices.
    *   [ ] User flows are intuitive.
    *   [ ] Loading and empty states are handled gracefully.
    *   [ ] Commit changes: `git add . && git commit -m "Phase 8: UI Polishing & Styling Complete"`

---

**Phase 9: Deployment & Final Testing**

*   [ ] **Vercel Deployment:**
    *   [ ] Connect GitHub repo to Vercel.
    *   [ ] Set environment variables (Supabase URL, Anon Key) in Vercel project settings.
    *   [ ] Deploy the application.
*   [ ] **Final Testing (on deployed version):**
    *   [ ] Repeat key user flow tests: Farmer registration & listing; Buyer registration, browsing, & chatting; Discount simulation.
    *   [ ] Test critical functionalities on the deployed environment.
*   [ ] **Prepare for Presentation:**
    *   [ ] Ensure GitHub repo is clean with a comprehensive `README.md` (project description, setup, how to run, tech stack).
    *   [ ] Prepare demo script and talking points aligned with judging criteria.
*   **Testing & Verification (Phase 9):**
    *   [ ] Application deploys successfully to Vercel.
    *   [ ] All core features work as expected on the live Vercel deployment.
    *   [ ] `README.md` is complete and informative.
    *   [ ] Demo is prepared and rehearsed.
    *   [ ] Final commit: `git add . && git commit -m "Phase 9: Deployment & Final Testing Complete"`

---

**Contingency & Simplification:**

*   **Mapping:** If complex, simplify to text input and predefined regions.
*   **Advanced Discounting AI:** MVP uses simple date rules.
*   **Farmer-to-Farmer Chat:** De-scope if time is tight.
*   **Push Notifications:** Out of scope for MVP (in-app only).

This plan is a guide. Prioritize based on hackathon timeline and core MVP features. Remember to commit frequently after completing smaller sub-tasks within each phase! 