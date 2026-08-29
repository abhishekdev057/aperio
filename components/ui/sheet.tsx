"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export function SheetContent({ children, className, title = "Details" }: { children: React.ReactNode; className?: string; title?: string }) {
  return <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=closed]:animate-out" />
    <Dialog.Content className={cn("fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto border-l bg-[var(--surface)] p-6 shadow-2xl focus:outline-none sm:p-8", className)}>
      <Dialog.Title className="sr-only">{title}</Dialog.Title>
      <Dialog.Close className="absolute right-5 top-5 grid size-9 place-items-center rounded-[9px] text-[var(--muted)] hover:bg-[var(--surface-muted)]" aria-label="Close panel"><X size={18} /></Dialog.Close>
      {children}
    </Dialog.Content>
  </Dialog.Portal>;
}
