// src/components/icons/flower-pot-icon.tsx

import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function FlowerPotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
      className={cn("h-6 w-6", props.className)}
    >
      <path
        fill="currentColor"
        d="M6.333 19.333h11.334l-1.666-1.666a1.333 1.333 0 0 0-1.02-.454H9.02a1.333 1.333 0 0 0-1.02.454zM5.111 21a1.333 1.333 0 0 1-1.28-1.667l2.667-10A1.333 1.333 0 0 1 7.832 8h8.336a1.333 1.333 0 0 1 1.333 1.333v.667a3.333 3.333 0 0 0 0 6.667v.666a1.333 1.333 0 0 1-1.333 1.334h-2.113a3.89 3.89 0 0 1-1.57.333h-2.11a3.89 3.89 0 0 1-1.57-.333H5.11Zm13.556-8.333v-2h-2v2zM12 7a4 4 0 0 1-4-4h8a4 4 0 0 1-4 4"
      ></path>
    </svg>
  );
}
