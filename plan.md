# AgriValue Connect - Development Plan

**Goal:** Build an MVP for "AgriValue Connect," a platform to reduce post-harvest losses for farmers with perishable goods by connecting them with buyers and facilitating timely sales.

**Core Technologies:** Next.js, Supabase, Tailwind CSS, shadcn/ui
**Package Manager:** pnpm

---

**Phase 1: Project Setup & Initialization**

*   [ ] **Git Setup:**
    *   [ ] Initialize a new Git repository: `git init`
    *   [ ] Create an initial commit with project files.
    *   [ ] Create a repository on GitHub (or preferred platform) and push the initial commit.
*   [ ] **Initialize Next.js Project:**
    *   [ ] Open your terminal.
    *   [ ] Run the Next.js create command:
        ```bash
        pnpm create next-app agri-value-connect --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
        ```
    *   [ ] `cd agri-value-connect`
*   [ ] **Supabase Project Setup:**
    *   [ ] Go to [supabase.com](https://supabase.com) and create a new project.
    *   [ ] Note down your Project URL and `anon` key (and `service_role` key, securely).
*   [ ] **Install Core Dependencies:**
    *   [ ] Supabase client & Auth Helpers:
        ```bash
        pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
        ```
    *   [ ] UI & Utilities:
        ```bash
        pnpm add date-fns react-hook-form lucide-react
        ```
    *   [ ] Mapping (if implementing):
        ```bash
        pnpm add react-leaflet leaflet
        pnpm add -D @types/leaflet
        ```
*   [ ] **Initialize `shadcn`:**
    *   [ ] Follow the `shadcn` installation guide for Next.js:
        ```bash
        pnpm dlx shadcn@latest init
        ```
    *   [ ] Configure `tailwind.config.js` and `globals.css` as per `shadcn/ui` instructions.
*   [ ] **Environment Variables:**
    *   [ ] Create a `.env.local` file in your project root.
    *   [ ] Add your Supabase Project URL and `anon` key.
    *   [ ] Ensure `.env.local` is in `.gitignore`.
*   [ ] **Supabase Client Helpers:**
    *   [ ] Create utility files for initializing Supabase client.
*   **Testing & Verification (Phase 1):**
    *   [ ] Verify Next.js app runs locally (`pnpm dev`).
    *   [ ] Confirm Supabase connection can be established (e.g., a simple test query).
    *   [ ] Check that `shadcn/ui` components can be imported and rendered without errors.
    *   [ ] Commit changes: `git add . && git commit -m "Phase 1: Project Setup & Initialization Complete"`

---

**Phase 2: Database Schema Design & Supabase Setup**

*   [ ] **Define Database Tables:**
    *   [ ] `profiles` table defined.
    *   [ ] `products` (Listings) table defined.
    *   [ ] `chats` table defined.
    *   [ ] `messages` table defined.
*   [ ] **Implement Schema in Supabase:**
    *   [ ] Tables created in Supabase Table Editor or via SQL.
    *   [ ] Relationships, data types, and defaults configured.
*   [ ] **Row Level Security (RLS):**
    *   [ ] RLS enabled for all tables.
    *   [ ] Policies for `profiles` implemented.
    *   [ ] Policies for `products` implemented.
    *   [ ] Policies for `chats` implemented.
    *   [ ] Policies for `messages` implemented.
*   [ ] **Supabase Storage:**
    *   [ ] Public bucket for product images created.
    *   [ ] Storage policies configured.
*   [ ] **Database Functions/Triggers:**
    *   [ ] (Recommended) Function to create `profile` on `auth.users` insert implemented and tested.
    *   [ ] (Optional) Trigger for `updated_at` timestamps.
*   **Testing & Verification (Phase 2):**
    *   [ ] Manually add sample data to tables via Supabase Studio.
    *   [ ] Test RLS policies by querying data as different test users (using Supabase SQL Editor's role impersonation or client-side tests).
    *   [ ] Verify image uploads to Supabase Storage bucket work as expected.
    *   [ ] Confirm the `profile` creation trigger/function works when a new user is added to `auth.users`.
    *   [ ] Commit changes: `git add . && git commit -m "Phase 2: Database Schema & Supabase Setup Complete"`

---

**Phase 3: Authentication**

*   [ ] **Integrate Supabase Auth:**
    *   [ ] Utilize `@supabase/auth-helpers-nextjs` and `@supabase/ssr` for session management.
*   [ ] **Auth UI:**
    *   [ ] Login form created using `shadcn/ui`.
    *   [ ] Signup form created using `shadcn/ui`.
    *   [ ] (Optional) Consider Supabase UI's `Password-Based Auth` block.
*   [ ] **Auth Logic:**
    *   [ ] `signUp` function implemented and working.
    *   [ ] `signInWithPassword` function implemented and working.
    *   [ ] `signOut` function implemented and working.
    *   [ ] User sessions handled correctly (persisted, cleared on logout).
    *   [ ] Redirects based on auth state implemented.
*   [ ] **Protected Routes/Layouts:**
    *   [ ] Middleware or layout checks for protecting routes implemented.
*   **Testing & Verification (Phase 3):**
    *   [ ] Test user registration: new user can sign up, `auth.users` entry created, `profiles` entry created.
    *   [ ] Test user login: existing user can log in.
    *   [ ] Test user logout: session is cleared.
    *   [ ] Verify protected routes are inaccessible when logged out and accessible when logged in.
    *   [ ] Check for appropriate error handling (e.g., incorrect password, user already exists).
    *   [ ] Commit changes: `git add . && git commit -m "Phase 3: Authentication Complete"`

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