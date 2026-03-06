import type { SessionUser } from '$lib/api/types';

declare global {
  namespace App {
    interface Locals {
      user: SessionUser | null;
      accessToken: string | null;
    }
    interface PageData {
      user: SessionUser | null;
      accessToken?: string | null;
      cableUrl?: string;
    }
  }
}

export {};
