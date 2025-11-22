'use client'

import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}




// 'use client'

// import * as React from 'react'
// import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
// import { X } from 'lucide-react' // ⬅️ جديد
// import { cn } from '@/lib/utils'
// import { buttonVariants } from '@/components/ui/button'

// function AlertDialog(props: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
//   return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
// }

// function AlertDialogTrigger(props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
//   return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
// }

// function AlertDialogPortal(props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
//   return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
// }

// function AlertDialogOverlay({
//   className,
//   ...props
// }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
//   return (
//     <AlertDialogPrimitive.Overlay
//       data-slot="alert-dialog-overlay"
//       className={cn(
//         'fixed inset-0 z-50 bg-black/50',
//         'data-[state=open]:animate-in data-[state=open]:fade-in-0',
//         'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
//         className
//       )}
//       {...props}
//     />
//   )
// }

// /** Grid: Header / Body / Footer + أقصى ارتفاع + منع overflow الخارجي */
// function AlertDialogContent({
//   className,
//   ...props
// }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
//   return (
//     <AlertDialogPortal>
//       <AlertDialogOverlay />
//       <AlertDialogPrimitive.Content
//         data-slot="alert-dialog-content"
//         className={cn(
//           'fixed left-1/2 top-1/2 z-50',
//           'w-[calc(100%-2rem)] sm:max-w-[680px]', // ⬅️ قريب من مقاس الصورة
//           'translate-x-[-50%] translate-y-[-50%]',
//           'rounded-lg border bg-background shadow-lg',
//           'grid grid-rows-[auto,1fr,auto]',
//           'max-h-[90vh] overflow-hidden',
//           'duration-200 data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0',
//           'data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0',
//           className
//         )}
//         {...props}
//       />
//     </AlertDialogPortal>
//   )
// }

// function AlertDialogHeader({
//   className,
//   children,
//   ...props
// }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="alert-dialog-header"
//       className={cn('relative px-6 pt-4 pb-3 text-center', className)}
//       {...props}
//     >
//       {/* زر إغلاق */}
//       <AlertDialogPrimitive.Cancel
//         className={cn(
//           buttonVariants({ variant: 'ghost', size: 'icon' }),
//           'absolute left-2 top-2 h-8 w-8  hover:text-foreground'
//         )}
//       >
//         <X className="h-5 w-5" />
//       </AlertDialogPrimitive.Cancel>

//       <div className="flex flex-col gap-1 items-center">{children}</div>

//       {/* الفاصل */}
//       <div className="mt-3 h-px w-full bg-border" />
//     </div>
//   )
// }

// /** جسم قابل للتمرير داخل المودال */
// function AlertDialogBody({
//   className,
//   ...props
// }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="alert-dialog-body"
//       className={cn('px-6 py-4 overflow-y-auto overscroll-contain', className)}
//       {...props}
//     />
//   )
// }

// /** Footer ثابت أسفل المودال */
// function AlertDialogFooter({
//   className,
//   ...props
// }: React.ComponentProps<'div'>) {
//   return (
//     <div
//       data-slot="alert-dialog-footer"
//       className={cn(
//         'px-6 py-4 border-top border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
//         'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
//         className
//       )}
//       {...props}
//     />
//   )
// }

// function AlertDialogTitle({
//   className,
//   ...props
// }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
//   return (
//     <AlertDialogPrimitive.Title
//       data-slot="alert-dialog-title"
//       className={cn('text-[15px] font-semibold tracking-wide', className)}
//       {...props}
//     />
//   )
// }

// function AlertDialogDescription({
//   className,
//   ...props
// }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
//   return (
//     <AlertDialogPrimitive.Description
//       data-slot="alert-dialog-description"
//       className={cn('text-xs', className)}
//       {...props}
//     />
//   )
// }

// function AlertDialogAction({
//   className,
//   ...props
// }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
//   return (
//     <AlertDialogPrimitive.Action
//       className={cn(buttonVariants(), className)}
//       {...props}
//     />
//   )
// }

// function AlertDialogCancel({
//   className,
//   ...props
// }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
//   return (
//     <AlertDialogPrimitive.Cancel
//       className={cn(buttonVariants({ variant: 'outline' }), className)}
//       {...props}
//     />
//   )
// }

// export {
//   AlertDialog,
//   AlertDialogPortal,
//   AlertDialogOverlay,
//   AlertDialogTrigger,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogBody,
//   AlertDialogFooter,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogAction,
//   AlertDialogCancel,
// }
