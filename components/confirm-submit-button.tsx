"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

export function ConfirmSubmitButton({
  message,
  children,
  ...props
}: ButtonProps & { message: string }) {
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      {...props}
      type="submit"
      loading={pending}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          return;
        }
        setPending(true);
      }}
    >
      {children}
    </Button>
  );
}
