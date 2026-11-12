import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      className
    )}
    {...props}
  />
));
Checkbox.displayName = CheckboxPrimitive.displayName;

export { Checkbox };
