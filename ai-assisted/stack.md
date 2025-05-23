

**Core Stack:**

1.  **Frontend Framework:** **Next.js**
    *   *Why:* SSR/SSG, API routes (Supabase functions for complex backend logic), great DX, Vercel hosting.
2.  **Backend & Database:** **Supabase**
    *   *Why:* PostgreSQL, Auth, Realtime (for chat & notifications), Storage (for image uploads), Instant APIs. 
    *   **`@supabase/supabase-js`:** The official JavaScript client library for interacting with your Supabase backend.

**UI & Styling:**

3.  **UI Components:** **shadcn/ui**
    *   *Why:* This is a fantastic choice. It's not a traditional component library you install as a dependency. Instead, you copy-paste composable component code directly into your project. This gives you full control over styling and behavior. It's built with Tailwind CSS and Radix UI for accessibility.
    *   The fact that **Supabase UI** is *also* built on `shadcn/ui` is a massive advantage. This means seamless integration and a consistent look and feel if you use components from both.
4.  **Styling:** **Tailwind CSS**
    *   *Why:* Utility-first CSS framework that works beautifully with Next.js and `shadcn/ui`. Allows for rapid styling directly in your JSX.
5.  **Icons:** **Lucide React** or **Heroicons**
    *   *Why:* `shadcn/ui` often uses Lucide icons in its examples. Both are comprehensive, well-designed SVG icon sets that are easy to integrate into React projects.

**Key Feature Implementation - Libraries & Approaches:**

6.  **Authentication:**
    *   **Supabase Auth:** Handles user registration (email/password, phone) and login.
    *   **Supabase UI (`Password-Based Auth` block):**  Supabase UI provides ready-to-use components for sign-up, sign-in, password reset, etc., built with `shadcn/ui`. This will save you a *ton* of time.
7.  **Image Uploads (for Produce):**
    *   **Supabase Storage:** For storing the uploaded images.
    *   **Supabase UI (`Dropzone` block):** Again, Supabase UI offers a `File Upload Dropzone` component. This handles drag-and-drop, previews, and uploads directly to Supabase Storage. 
8.  **Chat Functionality:**
    *   **Supabase Realtime:** Use this for sending and receiving messages in real-time.. A complete, styled chat interface component that leverages Supabase Realtime. It includes features like message synchronization and persistence.

9.  **Mapping (Location/Meeting Points):**
    *   **React Leaflet:** A mature React wrapper for Leaflet.js. Good for displaying markers for farmer locations/meeting points and allowing buyers to browse visually. 
    *   **`react-geolocated` ):** To get farmer's current location if they opt-in (for auto-filling location fields).
 
10. **Date & Time Handling:**
    *   **`date-fns`** or **Day.js:** Lightweight libraries for parsing, formatting, and manipulating dates (for harvest dates, sell-by dates, chat timestamps). 
11. **Forms:**
    *   **React Hook Form:** Excellent for managing form state, validation, and submission. Integrates well with UI libraries like `shadcn/ui`.
