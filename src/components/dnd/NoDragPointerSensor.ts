import { PointerSensor, PointerSensorOptions } from '@dnd-kit/core'

/**
 * Custom PointerSensor that prevents drag activation when the pointer event
 * originates inside an element (or its ancestors) marked with the
 * `[data-prevent-dnd]` attribute. Attach this attribute to any interactive
 * UI like dialogs, selects, date pickers, inputs, etc. to avoid accidental
 * board or task drags while interacting with forms.
 */
export class NoDragPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: any, options: PointerSensorOptions) => {
        const target = nativeEvent?.target as HTMLElement | null
        if (target && target.closest('[data-prevent-dnd]')) {
          return false
        }
        // Fallback to default handler logic by invoking onActivation if provided after constraint passes
        if (options?.onActivation) {
          // Allow base class to manage timing; simply return true to continue
        }
        return true
      }
    }
  ]
}

export type NoDragPointerSensorOptions = PointerSensorOptions
