"use client";

import { useState } from "react";
import Link from "next/link";
import { ActionButton } from "./ActionButton";

export default function MembershipButton() {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Link href="/signup">
      <ActionButton
        className="mt-4"
        onClick={() => setIsNavigating(true)}
        disabled={isNavigating}
      >
        Become a member
      </ActionButton>
    </Link>
  );
}
