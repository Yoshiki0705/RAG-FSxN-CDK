"use client";

import * as React from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useBedrockParams } from "@/store/useBedrockParam";

export function TemperatureSelector() {
  const temperature = useBedrockParams((state) => state.temperature);
  const setTemp = useBedrockParams((state) => state.setTemp);

  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {temperature}
              </span>
            </div>
            <Slider
              id="temperature"
              max={1}
              defaultValue={temperature}
              step={0.1}
              onValueChange={setTemp}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="Temperature"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="w-[260px] text-sm"
          side="left"
        >
          The amount of randomness injected into the response.
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}