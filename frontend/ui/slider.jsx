import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  ...props
}) {
  const resolved = React.useMemo(() => (
    Array.isArray(value)
      ? value
      : Array.isArray(defaultValue)
        ? defaultValue
        : [min, max]
  ), [value, defaultValue, min, max]);

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={onValueChange}
      className={cn("slider-root", className)}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className={cn("slider-track")}> 
        <SliderPrimitive.Range data-slot="slider-range" className={cn("slider-range")} />
      </SliderPrimitive.Track>
      {Array.from({ length: resolved.length }, (_, i) => (
        <SliderPrimitive.Thumb key={i} data-slot="slider-thumb" className={cn("slider-thumb")} />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };


