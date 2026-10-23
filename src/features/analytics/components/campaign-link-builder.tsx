"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { buildCampaignLink, PLACEMENTS, type Placement } from "../model/campaign-link";

const INPUT_CLASS = "rounded-lg bg-muted/40";

/**
 * Builds a tagged storefront link from a page, a placement and a campaign
 * name. The tags follow `model/campaign-link.ts`, so the campaign report on
 * `/analytics` groups every link for one campaign together.
 */
export function CampaignLinkBuilder({ storefrontOrigin }: { storefrontOrigin: string }) {
  const [destination, setDestination] = useState("");
  const [placement, setPlacement] = useState<Placement>("instagram_ad");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [metaNames, setMetaNames] = useState(true);

  const isMetaAd = PLACEMENTS[placement].meta;
  const fromMeta = isMetaAd && metaNames;
  const link = buildCampaignLink({ destination, placement, campaign, content, metaNames }, storefrontOrigin);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <section className="space-y-5 rounded-xl border border-border bg-card p-5 lg:col-span-3">
        <div className="space-y-1.5">
          <Label htmlFor="link-destination" className="text-sm font-medium">
            Page
          </Label>
          <Input
            id="link-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={`${storefrontOrigin}/product/… or /category/laptops`}
            className={INPUT_CLASS}
          />
          <p className="text-xs text-muted-foreground">Paste a storefront link or type a path. Empty means the home page.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Where it runs</Label>
          <Select value={placement} onValueChange={(v) => setPlacement(v as Placement)}>
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PLACEMENTS) as Placement[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {PLACEMENTS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isMetaAd && (
          <label className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 text-sm">
            <Switch checked={metaNames} onCheckedChange={setMetaNames} className="mt-0.5" />
            <span>
              <span className="font-medium text-foreground">Let Ads Manager fill in the names</span>
              <span className="block text-xs text-muted-foreground">
                One link for every ad: Meta puts each campaign&apos;s and ad&apos;s name in the tags. Name them in
                lowercase with hyphens, like october-laptop-deals.
              </span>
            </span>
          </label>
        )}

        {!fromMeta && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="link-campaign" className="text-sm font-medium">
                Campaign
              </Label>
              <Input
                id="link-campaign"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="October laptop deals"
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-content" className="text-sm font-medium">
                Ad or post <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="link-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Reel 1"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 lg:col-span-2">
        {link.ok ? (
          fromMeta ? (
            <>
              <CopyField label="Website URL" value={link.pageUrl} />
              <CopyField label="URL parameters" value={link.parameters} />
              <p className="text-xs leading-relaxed text-muted-foreground">
                In Ads Manager, paste these into the ad&apos;s Website URL and URL parameters fields. They work for
                every campaign and ad.
              </p>
            </>
          ) : (
            <CopyField label="Your link" value={link.url} />
          )
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <AppIcon icon="solar:info-circle-linear" className="size-4 shrink-0" />
            {link.error}
          </p>
        )}
      </section>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <p className="break-all rounded-lg bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">{value}</p>
      <Button variant="outline" size="sm" onClick={copy} className="h-8 gap-2 rounded-lg text-xs font-medium">
        <AppIcon icon={copied ? "solar:check-circle-linear" : "solar:copy-linear"} className="size-4" />
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
