# UI/UX Pro Max & System Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Overview
Applying UI/UX Pro Max design intelligence rules (Touch targets, Progressive skeleton loading, Accessible feedback, Form polish, Empty states) to upgrade Filo Yönetim from good to world-class enterprise SaaS quality.

---

### Task 1: Toast Notification System (Replace raw `alert()` calls)
- [ ] Create `src/components/ui/Toast.tsx` with accessible toast container, autohide, sound trigger, and multiple types (`success`, `error`, `info`, `warning`).
- [ ] Wrap `ToastProvider` in `src/components/providers/ClientProviders.tsx`.
- [ ] Export `useToast()` hook.

### Task 2: Progressive Shimmer Skeleton Loaders (Core Web Vitals & Zero CLS)
- [ ] Create `src/components/ui/Skeleton.tsx` with `KpiSkeleton`, `TableSkeleton`, and `CardSkeleton` components matching exact dimensions.
- [ ] Implement skeleton loading states in `src/app/page.tsx` (Dashboard), `src/app/vehicles/page.tsx`, and `src/app/customers/page.tsx`.

### Task 3: Form Feedback & Alert Modernization in Key Workflows
- [ ] Update `src/app/page.tsx` modal actions (Quick rent, Return rental, Oil change, Rental extension) to use `toast.success()` and `toast.error()`.
- [ ] Update `src/app/vehicles/page.tsx` and `src/app/customers/page.tsx` actions to use `toast`.

### Task 4: Accessible Empty States & Focus Rings
- [ ] Add empty state illustrations and guidance for search & filter queries in `vehicles` and `customers`.
- [ ] Verify focus ring styles across buttons and inputs (`focus-visible:ring-2 focus-visible:ring-amber-500`).

### Task 5: Build & Verification
- [ ] Run `npx next build` with 0 errors.
- [ ] Verify responsive layout across mobile and desktop.
- [ ] Commit and push to Git.
