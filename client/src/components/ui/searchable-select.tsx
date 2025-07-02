"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface SearchableSelectOption {
  value: string
  label: string
  searchText?: string // Campo adicional para busca customizada
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  searchPlaceholder?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Selecione uma opção...",
  emptyText = "Nenhum item encontrado",
  className,
  disabled = false,
  searchPlaceholder = "Buscar...",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Função para normalizar texto (remove acentos e converte para minúsculo)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  }

  // Filtrar opções baseado na busca
  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options

    const normalizedSearch = normalizeText(search)
    const searchTerms = normalizedSearch.split(" ").filter(term => term.length > 0)

    return options.filter(option => {
      const searchableText = normalizeText(
        `${option.label} ${option.searchText || ""} ${option.value}`
      )
      
      // Verifica se todos os termos de busca estão presentes
      return searchTerms.every(term => searchableText.includes(term))
    })
  }, [options, search])

  // Encontrar opção selecionada
  const selectedOption = options.find(option => option.value === value)

  // Resetar busca quando fechar
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearch("")
    }
  }

  // Selecionar opção
  const handleSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue === value ? "" : selectedValue)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !selectedOption && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Hook personalizado para facilitar uso com arrays de objetos
export function useSearchableSelectOptions<T>(
  items: T[],
  valueKey: keyof T,
  labelKey: keyof T,
  searchKeys?: (keyof T)[]
): SearchableSelectOption[] {
  return React.useMemo(() => {
    return items.map(item => ({
      value: String(item[valueKey]),
      label: String(item[labelKey]),
      searchText: searchKeys 
        ? searchKeys.map(key => String(item[key] || "")).join(" ")
        : undefined
    }))
  }, [items, valueKey, labelKey, searchKeys])
}