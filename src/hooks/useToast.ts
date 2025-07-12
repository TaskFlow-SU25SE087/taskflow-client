import { useToast as useToastOriginal } from '@/components/ui/use-toast'

export const useToast = () => {
  const { toast } = useToastOriginal()

  return {
    toast: ({
      title,
      description,
      variant = 'default'
    }: {
      title: string
      description: string
      variant?: 'default' | 'destructive'
    }) => {
      toast({
        title,
        description,
        variant
      })
    }
  }
}
