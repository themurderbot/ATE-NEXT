'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

type Lang = 'ar' | 'en'

type LangContextType = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (ar: string, en: string) => string
  dir: 'rtl' | 'ltr'
}

const LangContext = createContext<LangContextType>({
  lang: 'ar',
  setLang: () => {},
  t: (ar) => ar,
  dir: 'rtl',
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar')
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)