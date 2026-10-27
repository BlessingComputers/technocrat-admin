export const PREORDER_PERMISSIONS = {
  read: "preorders:read",
  issueTerms: "preorders:terms:issue",
  reviewEvidence: "preorders:evidence:review",
  revisePrice: "preorders:price:revise",
  cancelWithResolution: "preorders:cancel:refund",
  collectAtHandoff: "preorders:handoff:collect",
} as const;
