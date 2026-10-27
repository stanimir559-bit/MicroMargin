// Adapted from shadcn/ui new-york Button, MIT. See THIRD_PARTY_NOTICES.md.
// Uses the upstream Slot/CVA composition; project CSS replaces Tailwind classes.
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
const buttonVariants = cva('button', { variants: { variant: { default: 'primary', secondary: 'secondary', ghost: 'ghost' } }, defaultVariants: { variant: 'default' } });
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, asChild = false, type = 'button', ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} type={type} className={clsx(buttonVariants({ variant }), className)} {...props} />;
});
Button.displayName = 'Button';
export { Button };
