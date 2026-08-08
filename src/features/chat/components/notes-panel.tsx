import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notesFormSchema, type NotesFormInput } from "../schemas/notes-form";
import type { ConversationNotes, LeadStatus } from "../types/chat";

interface NotesPanelProps {
  notes: ConversationNotes | null | undefined;
  isLoading: boolean;
  /** Customer contact used to prefill the form when notes have no saved value. */
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  onSave: (values: NotesFormInput) => void;
  onClose: () => void;
}

const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
];

const titleCase = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();

const EMPTY_FORM: NotesFormInput = {
  leadName: "",
  leadEmail: "",
  leadPhone: "",
  leadAddress: "",
  leadStatus: undefined,
  productsDiscussed: "",
  pricesDiscussed: "",
  budgetRange: "",
  customerIntent: "",
  handoverNotes: "",
  followUpDate: "",
  followUpNote: "",
};

/** notes.followUpDate may be a full ISO datetime; the date input needs yyyy-mm-dd. */
function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

/**
 * Right panel: internal CRM notes for a customer conversation (design admin-1).
 * Covers all 12 documented note fields (#28) so agents can record everything
 * the contract persists.
 */
export function NotesPanel({
  notes,
  isLoading,
  customerName,
  customerEmail,
  customerPhone,
  onSave,
  onClose,
}: NotesPanelProps) {
  const { register, handleSubmit, reset, control } = useForm<NotesFormInput>({
    resolver: zodResolver(notesFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // Reseed the form whenever a different conversation's notes load. Fall back to
  // the customer's own name/email/phone when notes have no saved value, so staff
  // start from the known contact instead of blank fields.
  useEffect(() => {
    reset({
      leadName: notes?.leadName || customerName || "",
      leadEmail: notes?.leadEmail || customerEmail || "",
      leadPhone: notes?.leadPhone || customerPhone || "",
      leadAddress: notes?.leadAddress ?? "",
      leadStatus: notes?.leadStatus ?? undefined,
      productsDiscussed: notes?.productsDiscussed ?? "",
      pricesDiscussed: notes?.pricesDiscussed ?? "",
      budgetRange: notes?.budgetRange ?? "",
      customerIntent: notes?.customerIntent ?? "",
      handoverNotes: notes?.handoverNotes ?? "",
      followUpDate: toDateInputValue(notes?.followUpDate),
      followUpNote: notes?.followUpNote ?? "",
    });
  }, [notes, customerName, customerEmail, customerPhone, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="flex h-full flex-col gap-5 p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Notes</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notes panel"
          className="-mr-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <AppIcon icon="solar:close-circle-linear" className="size-5" />
        </button>
      </div>

      <div className="-mr-2 flex-1 space-y-5 overflow-y-auto pr-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Name</Label>
          <Input
            placeholder="Jojo Ade"
            className="rounded-lg bg-muted/40"
            {...register("leadName")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Email</Label>
          <Input
            type="email"
            placeholder="jojo@gmail.com"
            className="rounded-lg bg-muted/40"
            {...register("leadEmail")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Phone number</Label>
          <Input
            placeholder="09065443322"
            className="rounded-lg bg-muted/40"
            {...register("leadPhone")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Address</Label>
          <Input
            placeholder="12 Allen Avenue, Ikeja"
            className="rounded-lg bg-muted/40"
            {...register("leadAddress")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Status</Label>
          <Controller
            control={control}
            name="leadStatus"
            render={({ field }) => (
              <Select
                value={field.value ?? undefined}
                onValueChange={(v) => field.onChange(v as LeadStatus)}
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Product interest</Label>
          <Input
            placeholder="motherboard"
            className="rounded-lg"
            {...register("productsDiscussed")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Prices discussed</Label>
          <Input
            placeholder="₦120,000 for the board"
            className="rounded-lg"
            {...register("pricesDiscussed")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Budget range</Label>
          <Input
            placeholder="₦100,000 – ₦150,000"
            className="rounded-lg"
            {...register("budgetRange")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Customer intent</Label>
          <Input
            placeholder="Upgrading an office desktop"
            className="rounded-lg"
            {...register("customerIntent")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Handover notes</Label>
          <Textarea
            rows={3}
            placeholder="Context the next agent needs"
            className="resize-none rounded-lg"
            {...register("handoverNotes")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Follow-up date</Label>
          <Input
            type="date"
            className="rounded-lg"
            {...register("followUpDate")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Notes</Label>
          <Textarea
            rows={5}
            placeholder="Anything else worth remembering"
            className="resize-none rounded-lg"
            {...register("followUpNote")}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="mt-2 h-12 shrink-0 rounded-lg bg-primary font-semibold text-primary-foreground"
      >
        Save
      </Button>
    </form>
  );
}
