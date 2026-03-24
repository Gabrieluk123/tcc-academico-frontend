import { getLocale, setLocale } from '@/paraglide/runtime'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const localeConfig: Record<string, { flag: string; label: string; tooltip: string }> = {
  'pt-BR': { flag: '🇧🇷', label: 'PT', tooltip: 'Mudar para Português' },
  'en':    { flag: '🇺🇸', label: 'EN', tooltip: 'Switch to English' },
}

const localeOrder = ['pt-BR', 'en'] as const

export default function LocaleSwitcher() {
  const currentLocale = getLocale()
  const nextLocale = localeOrder.find((l) => l !== currentLocale) ?? localeOrder[0]
  const current = localeConfig[currentLocale] ?? localeConfig['pt-BR']

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs font-semibold"
          onClick={() => setLocale(nextLocale)}
          aria-label={localeConfig[nextLocale]?.tooltip}
        >
          <span>{current.flag}</span>
          <span>{current.label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{localeConfig[nextLocale]?.tooltip}</TooltipContent>
    </Tooltip>
  )
}
