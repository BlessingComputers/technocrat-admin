"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getErrorMessage } from "@/lib/api/error-message";
import { useCreatePromotion } from "../api/promotions.queries";
import { PromotionForm } from "./promotion-form";

export function PromotionCreateView() {
  const router = useRouter();
  const createPromotion = useCreatePromotion();

  const handleSubmit = (values: {
    title: string;
    description?: string;
    startAt?: string | null;
    endAt?: string | null;
  }) => {
    const promise = createPromotion.mutateAsync(values);
    toast.promise(promise, {
      loading: "Creating promotion…",
      success: "Promotion created — now add its slides.",
      error: (err) => getErrorMessage(err, "Failed to create promotion."),
    });
    promise.then((promotion) => router.push(`/socials/${promotion.id}`));
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="New Promotion"
        description="Starts as a draft. You'll add slide images and publish it on the next screen."
      />
      <Card className="border p-6">
        <PromotionForm
          onSubmit={handleSubmit}
          isPending={createPromotion.isPending}
          submitLabel="Create and continue"
        />
      </Card>
    </div>
  );
}
