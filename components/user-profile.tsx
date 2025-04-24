'use client';

import { UserButton, useUser } from "@clerk/nextjs";

export function UserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="flex items-center gap-4">
      <p>Welcome, {user?.firstName}</p>
      <UserButton afterSignOutUrl="/"/>
    </div>
  );
} 